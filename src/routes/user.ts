import { Router, type Request, type Response } from 'express';
import bcrypt from "bcryptjs";
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises'
import {db} from "../db.js";
import {z} from "zod";

import {asyncHandler} from "../utils/asyncHandler.js";
import {getAdmin, getUser} from "../utils/auth.js";
import {
    duplicationLoginException,
    duplicationPasswordException,
    emptyUserDataException,
    photoFormatException,
    userException
} from "../utils/httpExceptions.js";
import {successResponse} from "../responses/successResponse.js";
import {uploadStorage} from "../composables/useUploadStorage.js";
import {ALLOWED_PHOTO_SUFFIX, AVATARS_DIRECTORY, BASE_STORAGE_DIR} from "../config.js";
import {createUrl} from "../composables/useCreateUrl.js";
import {nameSchema} from "../schemas/nameSchema.js";
import {passwordSchema} from "../schemas/passwordSchema.js";
import type {User} from "../types/express.js";
import {idSchema} from "../schemas/idSchema.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {getSkip} from "../composables/useGetSkip.js";
import {getHasMore} from "../composables/useGetHasMore.js";

export const userRouter = Router();

const redactName = async (req: Request, res: Response, currentUser: User) => {
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

const redactPassword = async (req: Request, res: Response, currentUser: User) => {
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

export const loginSchema = z.object({
    login: z.string(),
})
const redactLogin = async (req: Request, res: Response, currentUser: User) => {
    const {login} = loginSchema.parse(req.body)

    const formattedLogin = login?.trim()
    if (!formattedLogin) throw emptyUserDataException

    const userWithLogin = await db.user.findUnique({
        where: {
            login
        },
        select: {
            id: true,
        }
    })

    if (userWithLogin) throw duplicationLoginException

    await db.user.update({
        where: {
            id: currentUser.id
        },
        data: {
            login: formattedLogin,
        }
    })

    return successResponse(res)
}

const uploadAvatar = async (req: Request, res: Response, currentUser: User) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const avatarFile = files?.avatar?.[0]

    if (!avatarFile) throw emptyUserDataException

    const avatarSuffix = path.extname(avatarFile.originalname).toLowerCase()
    if (!ALLOWED_PHOTO_SUFFIX.has(avatarSuffix)) throw photoFormatException

    let targetAvatarPath: string | null = null

    try {
        await fs.mkdir(AVATARS_DIRECTORY, {recursive: true})

        targetAvatarPath = path.join(AVATARS_DIRECTORY, `${currentUser.id}_${Date.now()}${avatarSuffix}`)
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
            newAvatarUrl: newAvatarUrl
        })
    } catch (err) {
        if (targetAvatarPath) await fs.unlink(targetAvatarPath).catch()

        await fs.unlink(files?.avatar?.[0]?.path ?? '').catch()

        throw err
    }
}

userRouter.patch('/redact_name', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUser = req.user!
    await redactName(req, res, currentUser)
}))

userRouter.patch('/redact_password', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUser = req.user!
    await redactPassword(req, res, currentUser)
}))

const upload = multer({storage: uploadStorage})
userRouter.post(
    '/upload_avatar',
    getUser(),
    upload.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const currentUser = req.user!
        await uploadAvatar(req, res, currentUser)
    })
)


// --- для админки --- //
const getUserFromDB = async (id: number) => {
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
const getUserAndRedact = async (req: Request, res: Response, func: Function) => {
    const {id} = idSchema.parse(req.params)

    const user = await getUserFromDB(id)
    if (!user) throw userException
    await func(req, res, user)
}

userRouter.get('/all', asyncHandler(async (req: Request, res: Response) => {
    const {page, limit} = pageLimitSchema.parse(req.query)

    const skip = getSkip(page, limit)

    let [users, total] = await Promise.all([
        db.user.findMany({
            select: {
                id: true,
                name: true,
                login: true,
                avatarUrl: true,
            },
            skip,
            take: limit,
        }),
        db.user.count()
    ])

    res.json({
        users,
        page,
        limit,
        total,
        hasMore: getHasMore(skip, limit, total),
    })
}))

userRouter.patch('/redact_name/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await getUserAndRedact(req, res, redactName)
}))

userRouter.patch('/redact_login/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await getUserAndRedact(req, res, redactLogin)
}))

userRouter.patch('/redact_password/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await getUserAndRedact(req, res, redactPassword)
}))

userRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    await db.user.delete({
        where: {
            id
        }
    })

    successResponse(res)
}))

userRouter.post('/upload_avatar/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const user = await getUserFromDB(id)
    if (!user) throw userException

    await uploadAvatar(req, res, user)
}))

userRouter.patch('/delete_avatar/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const user = await getUserFromDB(id)
    if (!user || !user.avatarUrl) throw userException

    await db.user.update({
        where: {
            id
        },
        data: {
            avatarUrl: '',
        }
    })

    const avatarUrl = user.avatarUrl.replace('/static/', '')
    const avatarPath = path.join(BASE_STORAGE_DIR, avatarUrl)

    try {
        await fs.unlink(avatarPath)
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            console.log('Старый файл аватарки не найден, пропускаем удаление')
        } else {
            console.error('Ошибка при удалении аватарки:', err)
        }
    }

    successResponse(res)
}))