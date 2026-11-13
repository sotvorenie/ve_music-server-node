import bcrypt from "bcryptjs";
import {db} from "@/db.js";
import type {User} from "@/types/express.js";

import {deletePath} from "@composables/useDeletePath.js";
import {createAvatar} from "@composables/useCreateAvatar.js";

import {duplicationPasswordException} from "@utils/httpExceptions.js";

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
            id: currentUser.id,
        },
        data: {
            password: newPassword,
        },
    })
}

export const uploadUserAvatar = async (
    currentUser: User,
    avatarFile: Express.Multer.File,
) => {
    const url = await createAvatar(avatarFile, currentUser.id, 'user')

    await db.user.update({
        where: {
            id: currentUser.id,
        },
        data: {
            avatarUrl: url,
        },
    })

    try {
        if (currentUser.avatarUrl) await deletePath(currentUser.avatarUrl)
    } catch {}

    return url
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