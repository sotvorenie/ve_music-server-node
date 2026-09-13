import {type Request, type Response} from "express";
import fs from "node:fs/promises";
import path from "node:path";
import {db} from "@/db.js";

import {ALLOWED_PHOTO_SUFFIX, ARTISTS_AVATARS_DIRECTORY} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";

import {artistException, emptyUserDataException, photoFormatException} from "@utils/httpExceptions.js";

export const artistUploadAvatarService = async (
    req: Request,
    res: Response,
    id: number
) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const avatarFile = files?.avatar?.[0]

    if (!avatarFile) throw emptyUserDataException

    const artist = await db.artist.findUnique({
        where: {
            id
        },
        select: {
            avatarUrl: true,
        }
    })
    if (!artist) throw artistException

    const avatarSuffix = path.extname(avatarFile.originalname).toLowerCase()
    if (!ALLOWED_PHOTO_SUFFIX.has(avatarSuffix)) throw photoFormatException

    let targetAvatarPath: string | null = null

    try {
        await fs.mkdir(ARTISTS_AVATARS_DIRECTORY, {recursive: true})

        targetAvatarPath = path.join(ARTISTS_AVATARS_DIRECTORY, `${id}_${Date.now()}${avatarSuffix}`)
        await fs.rename(avatarFile.path, targetAvatarPath)

        const newAvatarUrl = createUrl(targetAvatarPath)
        await db.artist.update({
            where: {
                id
            },
            data: {
                avatarUrl: newAvatarUrl,
            }
        })

        if (artist.avatarUrl) {
            const oldAvatarName = artist.avatarUrl.replace('/static/', '')
            const oldAvatarPath = path.join(ARTISTS_AVATARS_DIRECTORY, oldAvatarName)

            try {
                await fs.unlink(oldAvatarPath)
            } catch (err: any) {
                if (err.code === 'ENOENT') {
                    console.log('Старый файл аватарки не найден, пропускаем удаление')
                } else {
                    console.error('Ошибка при удалении аватарки:', err)
                }
            }
        }

        res.status(201).json({
            url: newAvatarUrl
        })
    } catch (err) {
        if (targetAvatarPath) await fs.unlink(targetAvatarPath).catch()

        await fs.unlink(files?.avatar?.[0]?.path ?? '').catch()

        throw err
    }
}