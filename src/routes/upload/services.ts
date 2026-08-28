import {type Request, type Response} from "express";
import {idSchema} from "@schemas/idSchema.js";
import {emptyMusicDataException} from "@utils/httpExceptions.js";
import path from "node:path";
import {MUSIC_DIRECTORY} from "@/config.js";
import fs from "node:fs/promises";
import {createUrl} from "@composables/useCreateUrl.js";
import {db} from "@/db.js";

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

        await fs.mkdir(directory, {recursive: true})

        targetPath = path.join(directory, `${Date.now()}${suffix}`)
        await fs.rename(file.path, targetPath)

        const url = createUrl(targetPath)

        await db.music.update({
            where: {
                id
            },
            data: await type.data(url, targetPath)
        })

        res.status(201).json({
            newUrl: url,
        })
    } catch (err) {
        if (targetPath) await fs.unlink(targetPath).catch()

        await fs.unlink(files?.[type.title]?.[0]?.path ?? '').catch()

        throw err
    }
}