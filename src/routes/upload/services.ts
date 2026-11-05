import {type Request, type Response} from "express";
import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {ALLOWED_MUSIC_SUFFIX, MUSIC_DIRECTORY} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";
import {getMusicDuration} from "@composables/useGetAudioDuration.js";
import {safeReaddir} from "@composables/useSafeReaddir.js";
import {createAudio} from "@composables/useCreateAudio.js";

import {audioFormatException, emptyMusicDataException} from "@utils/httpExceptions.js";

import {idSchema} from "@schemas/idSchema.js";

export const uploadServiceUploadFile = async (
    req: Request,
    res: Response,
    type: {
        title: string
        allowedSuffix: Set<string>,
        formatException: any,
        dirName: string,
        data: Function
    }
) => {
    const {id} = idSchema.parse(req.params)

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const file = files?.[type.title]?.[0]

    if (!file) throw emptyMusicDataException

    const suffix = path.extname(file.originalname).toLowerCase()
    if (!type.allowedSuffix.has(suffix)) throw type.formatException

    let targetPath: string | null = null

    try {
        const directory = path.join(MUSIC_DIRECTORY, type.dirName)

        req.checkAborted()

        await fs.mkdir(directory, {recursive: true})

        req.checkAborted()

        targetPath = path.join(directory, `${Date.now()}${suffix}`)
        await fs.rename(file.path, targetPath)

        const url = createUrl(targetPath)

        req.checkAborted()

        await db.music.update({
            where: {
                id
            },
            data: await type.data(url, targetPath)
        })

        res.status(201).json({
            url: url,
        })
    } catch (err) {
        if (targetPath) await fs.unlink(targetPath).catch()

        await fs.unlink(files?.[type.title]?.[0]?.path ?? '').catch()

        throw err
    }
}

export const uploadServiceUploadAudio = async (
    audioFile: Express.Multer.File,
    title: string,
    genreId: number,
    artistsIds: number[],
    codec: string,
    segmentTime: number,
    req: Request
) => {
    let id: number = -1

    const musicSuffix = path.extname(audioFile.originalname).toLowerCase()
    if (!ALLOWED_MUSIC_SUFFIX.has(musicSuffix)) throw audioFormatException

    try {
        const musicDuration = await getMusicDuration(audioFile.path)

        const musicDirectory = path.join(MUSIC_DIRECTORY, 'music')
        await fs.mkdir(musicDirectory, {recursive: true})

        const music = await db.music.create({
            data: {
                name: title,
                url: `pending-${crypto.randomUUID()}`,
                duration: musicDuration,
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

        const bitrates = await createAudio(audioFile.path, targetMusicPath, segmentTime, req)

        let segmentsCount: number = 0
        const entries = await safeReaddir(targetMusicPath)
        const firstFolder = entries.find(entry => entry.isDirectory())
        if (firstFolder) {
            const folderPath = path.join(targetMusicPath, firstFolder.name)
            const files = await safeReaddir(folderPath)
            segmentsCount = files.filter(file => file.name.endsWith('.m4s')).length
        }

        await fs.unlink(audioFile.path).catch()

        return {
            id,
            segmentsCount,
            bitrates
        }
    } catch (err) {
        if (id !== -1) {
            await fs.rm(path.join(MUSIC_DIRECTORY, 'music', String(id)), { recursive: true, force: true }).catch()
            await db.music.delete({ where: { id } }).catch()
        }
        throw err
    }
}

export const uploadServiceUpdateAudio = async (
    req: Request,
    res: Response,
    segmentTime: number,
): Promise<void> => {
    const {id} = idSchema.parse(req.params)

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const file = files?.music?.[0]

    if (!file) throw emptyMusicDataException

    const suffix = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_MUSIC_SUFFIX.has(suffix)) throw audioFormatException

    let targetPath: string | null = null

    try {
        const directory = path.join(MUSIC_DIRECTORY, 'music')

        req.checkAborted()

        await fs.mkdir(directory, {recursive: true})

        req.checkAborted()

        targetPath = path.join(directory, String(id))

        const bitrates = await createAudio(file.path, targetPath, segmentTime, req)

        const files = await safeReaddir(targetPath)
        const segmentsCount = files.filter(file => file.name.endsWith('.m4s')).length

        const url = createUrl(targetPath)
        const duration = await getMusicDuration(file.path)

        req.checkAborted()

        await db.music.update({
            where: {
                id
            },
            data: {
                url,
                duration,
                segmentsCount,
                bitrates,
            }
        })

        res.status(201).json({
            url: url,
        })
    } catch (err) {
        if (targetPath) await fs.unlink(targetPath).catch()

        await fs.unlink(files?.music?.[0]?.path ?? '').catch()

        throw err
    }
}