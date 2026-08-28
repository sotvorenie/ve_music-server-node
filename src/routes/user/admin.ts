import {db} from "@/db.js";
import {type Request, type Response} from "express";
import {idSchema} from "@schemas/idSchema.js";
import {duplicationLoginException, emptyUserDataException, userException} from "@utils/httpExceptions.js";
import {asyncHandler} from "@utils/asyncHandler.js";
import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {getSkip} from "@composables/useGetSkip.js";
import {getHasMore} from "@composables/useGetHasMore.js";
import {getAdmin} from "@utils/auth.js";
import {z} from "zod";
import {successResponse} from "@responses/successResponse.js";
import path from "node:path";
import {BASE_STORAGE_DIR} from "@/config.js";
import fs from "node:fs/promises";
import {userRouter} from "@routes/user/index.js";
import {
    userServiceGetUserAndRedact,
    userServiceGetUserFromDB,
    userServiceRedactName,
    userServiceRedactPassword, userServiceUploadAvatar
} from "@routes/user/services.js";

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

userRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const user = await userServiceGetUserFromDB(id)
    if (!user) throw userException

    res.json(user)
}))

userRouter.patch('/redact_name/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await userServiceGetUserAndRedact(req, res, userServiceRedactName)
}))

const loginSchema = z.object({
    login: z.string(),
})
userRouter.patch('/redact_login/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {login} = loginSchema.parse(req.body)
    const {id} = idSchema.parse(req.params)

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
            id
        },
        data: {
            login: formattedLogin,
        }
    })

    return successResponse(res)
}))

userRouter.patch('/redact_password/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await userServiceGetUserAndRedact(req, res, userServiceRedactPassword)
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

    const user = await userServiceGetUserFromDB(id)
    if (!user) throw userException

    await userServiceUploadAvatar(req, res, user)
}))

userRouter.patch('/delete_avatar/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const user = await userServiceGetUserFromDB(id)
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