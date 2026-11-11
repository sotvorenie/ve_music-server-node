import type {Request, Response} from "express";
import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {ALLOWED_PHOTO_SUFFIX, MUSIC_DIRECTORY} from "@/config.js";

import {addMusic, addVideo} from "@routes/upload/services/helpers.js";

import {createUrl} from "@composables/useCreateUrl.js";

import {emptyMusicDataException, photoFormatException} from "@utils/httpExceptions.js";

import {musicInfoSchema} from "@schemas/musicInfoSchema.js";
import {pathSchema} from "@schemas/pathSchema.js";

export const uploadMusic = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { title, genre_id: genreId, artists, path: previewPath } = musicInfoSchema.extend(pathSchema.shape).parse(req.body)

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const musicFile = files?.music?.[0]
    const previewFile = files?.preview?.[0]
    const videoFile = files?.video?.[0]

    if (!musicFile) throw emptyMusicDataException

    let previewSuffix: string = ''
    if (previewFile) {
        previewSuffix = path.extname(previewFile.originalname).toLowerCase()
        if (!ALLOWED_PHOTO_SUFFIX.has(previewSuffix)) throw photoFormatException
    }

    let targetMusicPath: string | null = null
    let targetPreviewPath: string | null = null
    let targetVideoPath: string | null = null

    try {
        const previewsDirectory = path.join(MUSIC_DIRECTORY, 'previews')

        req.checkAborted()

        await fs.mkdir(previewsDirectory, {recursive: true})

        req.checkAborted()

        req.checkAborted()
        if (previewFile) {
            targetPreviewPath = path.join(previewsDirectory, `${Date.now()}${previewSuffix}`)
            await fs.rename(previewFile.path, targetPreviewPath)
        }

        req.checkAborted()

        const result = await addMusic(
            musicFile,
            title,
            genreId,
            artists,
            'aac',
            req,
        )
        targetMusicPath = result.targetMusicPath
        const {id, duration, segmentsCount, bitrates} = result

        await fs.rm(musicFile.path, {force: true}).catch()

        if (!!videoFile) {
            targetVideoPath = await addVideo(
                videoFile,
                {
                    id,
                    duration,
                },
                req,
            )
            await fs.rm(videoFile.path, {force: true}).catch()
        }

        const newMusic = await db.music.update({
            where: {
                id
            },
            data: {
                url: createUrl(path.join(MUSIC_DIRECTORY, 'music', String(id), 'master.m3u8')),
                previewUrl: targetPreviewPath ? createUrl(targetPreviewPath) : (previewPath || ''),
                videoClipUrl: targetVideoPath ? createUrl(targetVideoPath) : '',
                status: 'READY',
                segmentsCount,
                bitrates,
            }
        })

        res.status(201).json(newMusic)
    } catch (err) {
        if (targetMusicPath) await fs.rm(targetMusicPath, {recursive: true, force: true}).catch()
        if (targetPreviewPath) await fs.rm(targetPreviewPath, {force: true}).catch()
        if (targetVideoPath) await fs.rm(targetVideoPath, {recursive: true, force: true}).catch()

        await fs.rm(musicFile.path, {force: true}).catch()
        if (previewFile?.path) await fs.rm(previewFile.path, {force: true}).catch()
        if (videoFile?.path) await fs.rm(videoFile.path, {force: true}).catch()

        throw err
    }
}