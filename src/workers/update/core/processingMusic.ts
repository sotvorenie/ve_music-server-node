import fs from "node:fs/promises";
import path from "node:path";
import {db} from "@/db.js";
import type {Music} from "@/generated/prisma/client.js";

import {ALLOWED_MUSIC_SUFFIX, ALLOWED_VIDEO_SUFFIX, segmentTime, TRACKS_DIRECTORY, VIDEOS_DIRECTORY} from "@/config.js";

import {isLink} from "@/workers/update/core/isLink.js";
import {createAudio} from "@/workers/update/core/useCreateAudio.js";

import {createUrl} from "@composables/useCreateUrl.js";
import {deletePath} from "@composables/useDeletePath.js";
import {getAudioInfo} from "@composables/useGetAudioInfo.js";
import {getMasterPath} from "@composables/useGetMasterPath.js";

import {deleteTrack} from "@services/deleteTrack.js";

export const processingMusic = async (
    music: Music,
) => {
    const id = music.id

    await Promise.all([
        fs.mkdir(TRACKS_DIRECTORY, {recursive: true}),
        fs.mkdir(VIDEOS_DIRECTORY, {recursive: true}),
    ])

    const targetMusicPath = path.join(TRACKS_DIRECTORY, String(id))
    let targetVideoPath = music.videoClipUrl

    try {
        let duration: number = 0
        let segmentsCount: number = 0
        let bitrates: number[] = []

        let isVideoErr = false

        if (!isLink(music.url)) {
            await Promise.all([
                deletePath(targetMusicPath),
                deletePath(targetVideoPath),
            ])

            const musicSuffix = path.extname(music.url).toLowerCase()
            if (!ALLOWED_MUSIC_SUFFIX.has(musicSuffix)) {
                await deleteTrack(id)
                return
            }

            duration = await getAudioInfo(music.url, 'duration')

            await fs.mkdir(targetMusicPath, {recursive: true});

            ({bitrates, segmentsCount} = await createAudio(
                id,
                music.url,
                targetMusicPath,
                segmentTime,
            ))
        }

        if (music?.videoClipUrl && !isLink(music.videoClipUrl)) {
            try {
                const videoSuffix = path.extname(music.videoClipUrl).toLowerCase()
                if (ALLOWED_VIDEO_SUFFIX.has(videoSuffix)) {
                    targetVideoPath = path.join(VIDEOS_DIRECTORY, `${music.id}_${Date.now()}${videoSuffix}`)
                    await fs.rename(music.videoClipUrl, targetVideoPath)
                } else {
                    isVideoErr = true
                }
            } catch {
                const promises: Promise<unknown>[] = []
                if (!isLink(music.videoClipUrl)) {
                    promises.push(deletePath(music.videoClipUrl))
                    promises.push(deletePath(targetVideoPath))
                }
                await Promise.allSettled(promises)
                isVideoErr = true
            }
        }

        const promises: Promise<unknown>[] = [
            db.music.update({
                where: {
                    id,
                },
                data: {
                    url: isLink(music.url) ? music.url : createUrl(getMasterPath(id)),
                    videoClipUrl: isVideoErr ? null : isLink(music.videoClipUrl) ? music.videoClipUrl : createUrl(targetVideoPath),
                    status: 'READY',
                    segmentsCount,
                    bitrates,
                    ...(duration > 0 && {duration}),
                },
            })
        ]

        if (!isLink(music.url)) promises.push(deletePath(music.url))
        if (!isLink(music.videoClipUrl)) promises.push(deletePath(music.videoClipUrl))

        await Promise.allSettled(promises)
    } catch {
        const promises: Promise<unknown>[] = [deleteTrack(id)]

        if (!isLink(music.url)) {
            promises.push(deletePath(music.url))
            promises.push(deletePath(targetMusicPath))
        }
        if (!isLink(music.videoClipUrl)) {
            promises.push(deletePath(music.videoClipUrl))
            promises.push(deletePath(targetVideoPath))
        }

        await Promise.allSettled(promises)
    }
}