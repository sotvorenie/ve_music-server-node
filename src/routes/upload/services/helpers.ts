import type {Request} from "express";
import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {ALLOWED_MUSIC_SUFFIX, ALLOWED_VIDEO_SUFFIX, MUSIC_DIRECTORY, segmentTime} from "@/config.js";

import {getAudioInfo} from "@composables/useGetAudioInfo.js";
import {createAudio} from "@composables/useCreateAudio.js";
import {safeReaddir} from "@composables/useSafeReaddir.js";
import {createVideo} from "@composables/useCreateVideo.js";

import {audioFormatException, videoFormatException} from "@utils/httpExceptions.js";

export const addMusic = async (
    audioFile: Express.Multer.File,
    title: string,
    genreId: number,
    artistsIds: number[],
    codec: string,
    req: Request
) => {
    let id: number = -1

    const musicSuffix = path.extname(audioFile.originalname).toLowerCase()
    if (!ALLOWED_MUSIC_SUFFIX.has(musicSuffix)) throw audioFormatException

    try {
        const duration = await getAudioInfo(audioFile.path, 'duration')

        const musicDirectory = path.join(MUSIC_DIRECTORY, 'music')
        await fs.mkdir(musicDirectory, {recursive: true})

        const music = await db.music.create({
            data: {
                name: title,
                url: `pending-${crypto.randomUUID()}`,
                duration,
                previewUrl: '',
                videoClipUrl: '',
                genreId,
                artists: {
                    connect: artistsIds.map(artistId => ({id: artistId}))
                },
                codec,
                segmentTime,
                status: 'PROCESSING',
            },
            select: {
                id: true,
            }
        })
        id = music.id

        const targetMusicPath = path.join(musicDirectory, String(id))
        await fs.mkdir(targetMusicPath, {recursive: true})

        const bitrates = await createAudio(
            audioFile.path,
            targetMusicPath,
            segmentTime,
            req,
        )

        let segmentsCount: number = 0
        const entries = await safeReaddir(targetMusicPath)
        const firstFolder = entries.find(entry => entry.isDirectory())
        if (firstFolder) {
            const folderPath = path.join(targetMusicPath, firstFolder.name)
            const files = await safeReaddir(folderPath)
            segmentsCount = files.filter(file => file.name.endsWith('.m4s')).length
        }

        return {
            id,
            duration,
            segmentsCount,
            bitrates,
            targetMusicPath,
        }
    } catch (err) {
        if (id !== -1) {
            await fs.rm(path.join(MUSIC_DIRECTORY, 'music', String(id)), { recursive: true, force: true }).catch()
            await db.music.delete({ where: { id } }).catch()
        }
        throw err
    }
}

export const addVideo = async (
    videoFile: Express.Multer.File,
    audio: {
        id: number,
        duration: number,
    },
    req: Request,
): Promise<string> => {
    const videoSuffix = path.extname(videoFile.originalname).toLowerCase()
    if (!ALLOWED_VIDEO_SUFFIX.has(videoSuffix)) throw videoFormatException

    const videoDirectory = path.join(MUSIC_DIRECTORY, 'video')
    await fs.mkdir(videoDirectory, {recursive: true})

    const targetVideoPath = path.join(videoDirectory, String(audio.id))
    await fs.mkdir(targetVideoPath, {recursive: true})

    await createVideo(
        videoFile.path,
        targetVideoPath,
        segmentTime,
        audio,
        req,
    )

    return targetVideoPath
}