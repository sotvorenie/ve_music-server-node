import type {Request, Response} from "express";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {addVideo} from "@routes/upload/services/helpers.js";
import {createUrl} from "@composables/useCreateUrl.js";

import {emptyMusicDataException, musicException} from "@utils/httpExceptions.js";

import {idSchema} from "@schemas/idSchema.js";

export const uploadVideo = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const {id} = idSchema.parse(req.params)

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const file = files?.video?.[0]

    if (!file) throw emptyMusicDataException

    let targetPath: string | null = null

    const musicInfo = await db.music.findUnique({
        where: {
            id,
        },
        select: {
            id: true,
            duration: true,
        }
    })

    if (!musicInfo) throw musicException

    try {
        targetPath = await addVideo(
            file,
            {
                id: musicInfo.id,
                duration: musicInfo.duration,
            },
            req,
        )

        await fs.rm(file.path, {force: true}).catch()

        res.status(201).json({
            url: createUrl(targetPath),
        })
    } catch (err) {
        if (targetPath) await fs.rm(targetPath, {recursive: true, force: true}).catch()
        await fs.rm(file.path, {force: true}).catch()
        throw err
    }
}