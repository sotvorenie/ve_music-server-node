import {type Request, type Response} from "express";
import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {MUSIC_DIRECTORY} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";

import {emptyMusicDataException} from "@utils/httpExceptions.js";

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

    req.checkAborted()

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