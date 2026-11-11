import bcrypt from "bcryptjs";
import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import type {User} from "@/types/express.js";
import {ALLOWED_PHOTO_SUFFIX, AVATARS_DIRECTORY} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";
import {deletePath} from "@composables/useDeletePath.js";

import {
    duplicationPasswordException,
    photoFormatException,
} from "@utils/httpExceptions.js";

export const updateUserName = async (
    userId: number,
    name: string,
) => {
    const formattedName = name?.trim()

    await db.user.update({
        where: {
            id: userId,
        },
        data: {
            name: formattedName,
        },
    })
}

export const updateUserPassword = async (
    currentUser: User,
    password: string,
) => {
    const check: boolean = await bcrypt.compare(password, currentUser.password)
    if (check) throw duplicationPasswordException

    const newPassword = await bcrypt.hash(password, 10)

    await db.user.update({
        where: {
            id: currentUser.id
        },
        data: {
            password: newPassword,
        }
    })
}

export const uploadUserAvatar = async (
    currentUser: User,
    avatarFile: Express.Multer.File,
) => {
    const avatarSuffix = path.extname(avatarFile.originalname).toLowerCase()
    if (!ALLOWED_PHOTO_SUFFIX.has(avatarSuffix)) throw photoFormatException

    await fs.mkdir(AVATARS_DIRECTORY, {recursive: true})

    const targetAvatarPath = path.join(AVATARS_DIRECTORY, `${currentUser.id}_${Date.now()}${avatarSuffix}`)
    await fs.rename(avatarFile.path, targetAvatarPath)

    const newAvatarUrl = createUrl(targetAvatarPath)
    await db.user.update({
        where: {
            id: currentUser.id
        },
        data: {
            avatarUrl: newAvatarUrl,
        }
    })

    if (currentUser.avatarUrl) await deletePath(currentUser.avatarUrl)

    return newAvatarUrl
}

export const getUser = async (id: number) => {
    return db.user.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            name: true,
            login: true,
            password: true,
            avatarUrl: true,
            role: true,
        }
    })
}