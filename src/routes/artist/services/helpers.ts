import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {ALLOWED_PHOTO_SUFFIX, ARTISTS_AVATARS_DIRECTORY} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";
import {deletePath} from "@composables/useDeletePath.js";

import {artistException, photoFormatException} from "@utils/httpExceptions.js";

export const uploadAvatar = async (
    id: number,
    avatarFile: Express.Multer.File,
) => {
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

        if (artist.avatarUrl) await deletePath(artist.avatarUrl)

        return newAvatarUrl
    } catch (err) {
        if (targetAvatarPath) await fs.unlink(targetAvatarPath).catch()

        await fs.rm(avatarFile.path).catch()

        throw err
    }
}