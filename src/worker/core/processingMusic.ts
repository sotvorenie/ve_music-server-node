import fs from "node:fs/promises";
import path from "node:path";
import {db} from "@/db.js";
import type {Music} from "@/generated/prisma/client.js";

import {ALLOWED_MUSIC_SUFFIX, ALLOWED_VIDEO_SUFFIX, segmentTime, TRACKS_DIRECTORY, VIDEOS_DIRECTORY} from "@/config.js";

import {isLink} from "@worker/core/isLink.js";
import {setFailed} from "@worker/core/setFailed.js";
import {createAudio} from "@worker/tasks/useCreateAudio.js";
import {createVideo} from "@worker/tasks/useCreateVideo.js";

import {createUrl} from "@composables/useCreateUrl.js";
import {deletePath} from "@composables/useDeletePath.js";
import {getAudioInfo} from "@composables/useGetAudioInfo.js";
import {createMasterPath} from "@composables/useCreateMasterPath.js";

export const processingMusic = async (
    music: Music,
) => {
    const id = music.id

    await Promise.all([
        fs.mkdir(TRACKS_DIRECTORY, {recursive: true}),
        fs.mkdir(VIDEOS_DIRECTORY, {recursive: true}),
    ])

    const targetMusicPath = path.join(TRACKS_DIRECTORY, String(id))
    const targetVideoPath = path.join(VIDEOS_DIRECTORY, String(id))

    try {
        let duration: number = 0
        let segmentsCount: number = 0
        let bitrates: number[] = []

        if (!isLink(music.url)) {
            await Promise.all([
                deletePath(targetMusicPath),
                deletePath(targetVideoPath),
            ])

            const musicSuffix = path.extname(music.url).toLowerCase()
            if (!ALLOWED_MUSIC_SUFFIX.has(musicSuffix)) {
                await setFailed(id)
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

        if (music.urlWithClip && !isLink(music.urlWithClip)) {
            await Promise.all([
                deletePath(targetVideoPath),
                deletePath(createMasterPath(id, 'video')),
            ])

            const videoSuffix = path.extname(music.urlWithClip).toLowerCase()
            if (ALLOWED_VIDEO_SUFFIX.has(videoSuffix)) {
                await fs.mkdir(targetVideoPath, {recursive: true})

                await createVideo(
                    music.urlWithClip,
                    targetVideoPath,
                    segmentTime,
                    {
                        id,
                        duration,
                    },
                )
            }
        }

        const promises: Promise<unknown>[] = [
            db.music.update({
                where: {
                    id,
                },
                data: {
                    url: isLink(music.url) ? music.url : createUrl(createMasterPath(id, 'audio')),
                    urlWithClip: (!isLink(music.url) && isLink(music.urlWithClip)) ? null : createUrl(createMasterPath(id, 'video')),
                    status: 'READY',
                    segmentsCount,
                    bitrates,
                },
            })
        ]

        if (!isLink(music.url)) promises.push(deletePath(music.url))
        if (!isLink(music.urlWithClip)) promises.push(deletePath(music.urlWithClip))

        await Promise.allSettled(promises)
    } catch {
        const promises: Promise<unknown>[] = [setFailed(id)]

        if (!isLink(music.url)) {
            promises.push(deletePath(music.url))
            promises.push(deletePath(targetMusicPath))
        }
        if (!isLink(music.urlWithClip)) {
            promises.push(deletePath(music.urlWithClip))
            promises.push(deletePath(targetVideoPath))
        }

        await Promise.allSettled(promises)
    }
}