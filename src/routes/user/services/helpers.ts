import bcrypt from "bcryptjs";
import {db} from "@/db.js";
import type {User} from "@/types/express.js";

import {deletePath} from "@composables/useDeletePath.js";
import {createAvatar} from "@composables/useCreateAvatar.js";

import {duplicationPasswordException, invalidOldPasswordException, userException} from "@utils/httpExceptions.js";

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
    id: number,
    password: string,
    oldPassword: string,
) => {
    const user = await db.user.findUnique({
        where: {
            id,
        },
        select: {
            password: true,
        },
    })
    if (!user) throw userException

    const isOldValid = await bcrypt.compare(oldPassword, user.password)
    if (!isOldValid) throw invalidOldPasswordException

    const isSame: boolean = await bcrypt.compare(password, user.password)
    if (isSame) throw duplicationPasswordException

    const newPassword = await bcrypt.hash(password, 10)

    await db.user.update({
        where: {
            id,
        },
        data: {
            password: newPassword,
            tokenVersion: {increment: 1},
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

export const getUser = async (
    id: number,
) => {
    return db.user.findUnique({
        where: {
            id,
        },
    })
}