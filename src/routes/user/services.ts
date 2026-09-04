import {type Request, type Response} from "express";
import bcrypt from "bcryptjs";
import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import type {User} from "@/types/express.js";
import {ALLOWED_PHOTO_SUFFIX, AVATARS_DIRECTORY} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";

import {
    duplicationPasswordException,
    emptyUserDataException,
    photoFormatException,
    userException
} from "@utils/httpExceptions.js";

import {nameSchema} from "@schemas/nameSchema.js";
import {passwordSchema} from "@schemas/passwordSchema.js";
import {idSchema} from "@schemas/idSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const userServiceRedactName = async (req: Request, res: Response, currentUser: User) => {
    const {name} = nameSchema.parse(req.body)

    const formattedName = name?.trim()
    if (!formattedName) throw emptyUserDataException

    if (currentUser.name !== formattedName) {
        await db.user.update({
            where: {
                id: currentUser.id
            },
            data: {
                name: formattedName,
            }
        })
    }

    return successResponse(res)
}

export const userServiceRedactPassword = async (req: Request, res: Response, currentUser: User) => {
    const {password} = passwordSchema.parse(req.body)

    const formattedPassword = password?.trim()
    if (!formattedPassword) throw emptyUserDataException

    const check: boolean = await bcrypt.compare(formattedPassword, currentUser.password)
    if (check) throw duplicationPasswordException

    const newPassword = await bcrypt.hash(formattedPassword, 10)

    await db.user.update({
        where: {
            id: currentUser.id
        },
        data: {
            password: newPassword,
        }
    })

    return successResponse(res)
}

export const userServiceUploadAvatar = async (req: Request, res: Response, currentUser: User) => {
    req.checkAborted()

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const avatarFile = files?.avatar?.[0]

    if (!avatarFile) throw emptyUserDataException

    const avatarSuffix = path.extname(avatarFile.originalname).toLowerCase()
    if (!ALLOWED_PHOTO_SUFFIX.has(avatarSuffix)) throw photoFormatException

    let targetAvatarPath: string | null = null

    try {
        req.checkAborted()

        await fs.mkdir(AVATARS_DIRECTORY, {recursive: true})

        req.checkAborted()

        targetAvatarPath = path.join(AVATARS_DIRECTORY, `${currentUser.id}_${Date.now()}${avatarSuffix}`)
        await fs.rename(avatarFile.path, targetAvatarPath)

        req.checkAborted()

        const newAvatarUrl = createUrl(targetAvatarPath)
        await db.user.update({
            where: {
                id: currentUser.id
            },
            data: {
                avatarUrl: newAvatarUrl,
            }
        })

        req.checkAborted()

        if (currentUser.avatarUrl) {
            const oldAvatarName = currentUser.avatarUrl.replace('/static/', '')
            const oldAvatarPath = path.join(AVATARS_DIRECTORY, oldAvatarName)

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

export const userServiceGetUserFromDB = async (id: number) => {
    return db.user.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            name: true,
            login: true,
            password: true,
            avatarUrl: true
        }
    })
}
export const userServiceGetUserAndRedact = async (req: Request, res: Response, func: Function) => {
    const {id} = idSchema.parse(req.params)

    const user = await userServiceGetUserFromDB(id)
    if (!user) throw userException
    await func(req, res, user)
}
