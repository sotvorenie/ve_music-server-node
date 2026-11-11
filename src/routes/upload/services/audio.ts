import type {Request, Response} from "express";
import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {ALLOWED_MUSIC_SUFFIX, MUSIC_DIRECTORY, segmentTime} from "@/config.js";

import {getAudioInfo} from "@composables/useGetAudioInfo.js";
import {createAudio} from "@composables/useCreateAudio.js";
import {safeReaddir} from "@composables/useSafeReaddir.js";
import {createUrl} from "@composables/useCreateUrl.js";

import {audioFormatException, emptyMusicDataException} from "@utils/httpExceptions.js";

import {idSchema} from "@schemas/idSchema.js";

export const uploadAudio = async (
    req: Request,
    res: Response,
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

        const duration = await getAudioInfo(file.path, 'duration')

        const bitrates = await createAudio(file.path, targetPath, segmentTime, req)

        const files = await safeReaddir(targetPath)
        const segmentsCount = files.filter(file => file.name.endsWith('.m4s')).length

        const url = createUrl(targetPath)

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
        if (targetPath) await fs.rm(targetPath, {recursive: true, force: true}).catch()
        await fs.rm(file.path).catch()
        throw err
    }
}