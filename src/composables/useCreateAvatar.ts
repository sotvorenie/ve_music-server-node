import path from "node:path";
import fs from "node:fs/promises";
import sharp from 'sharp';

import {ALLOWED_PHOTO_SUFFIX, ARTISTS_AVATARS_DIRECTORY, AVATARS_DIRECTORY} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";
import {deletePath} from "@composables/useDeletePath.js";

import {photoFormatException} from "@utils/httpExceptions.js";

export const createAvatar = async (
    file: Express.Multer.File,
    id: number,
    type: 'artist' | 'user',
) => {
    const avatarSuffix = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_PHOTO_SUFFIX.has(avatarSuffix)) throw photoFormatException

    const currentDirectory = type === "artist" ? ARTISTS_AVATARS_DIRECTORY : AVATARS_DIRECTORY

    let targetAvatarPath: string | null = null

    try {
        await fs.mkdir(currentDirectory, {recursive: true})

        targetAvatarPath = path.join(currentDirectory, `${id}_${Date.now()}${avatarSuffix}`)

        await sharp(file.path)
            .resize(320, 320, {
                fit: "cover",
                withoutEnlargement: true,
            })
            .webp({quality: 80})
            .toFile(targetAvatarPath)

        await fs.rename(file.path, targetAvatarPath)

        return createUrl(targetAvatarPath)
    } catch (err) {
        if (targetAvatarPath) await deletePath(targetAvatarPath)
        throw err
    }
}