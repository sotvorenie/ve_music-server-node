import type {Request, Response} from "express";
import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {ALLOWED_PHOTO_SUFFIX, MUSIC_DIRECTORY} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";

import {emptyMusicDataException, photoFormatException} from "@utils/httpExceptions.js";

import {idSchema} from "@schemas/idSchema.js";

export const uploadPreview = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const {id} = idSchema.parse(req.params)

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const file = files?.preview?.[0]

    if (!file) throw emptyMusicDataException

    const suffix = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_PHOTO_SUFFIX.has(suffix)) throw photoFormatException

    let targetPath: string | null = null

    try {
        const directory = path.join(MUSIC_DIRECTORY, 'previews')

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
            data: {
                previewUrl: url,
            }
        })

        res.status(201).json({
            url: url,
        })
    } catch (err) {
        if (targetPath) await fs.rm(targetPath, {force: true}).catch()
        if (file?.path) await fs.rm(file.path, {force: true}).catch()
        throw err
    }
}