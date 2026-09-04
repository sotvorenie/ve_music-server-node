import {Router, type Request, type Response} from "express";
import {z} from "zod";
import {db} from "@/db.js";

import {
    userServiceGetUserAndRedact,
    userServiceGetUserFromDB,
    userServiceRedactName,
    userServiceRedactPassword, userServiceUploadAvatar
} from "@routes/user/services.js";

import {getSkip} from "@composables/useGetSkip.js";
import {getHasMore} from "@composables/useGetHasMore.js";

import {duplicationLoginException, emptyUserDataException, userException} from "@utils/httpExceptions.js";
import {asyncHandler} from "@utils/asyncHandler.js";
import {getAdmin} from "@utils/auth.js";

import {idSchema} from "@schemas/idSchema.js";
import {pageLimitSchema} from "@schemas/pageLimitSchema.js";

import {successResponse} from "@responses/successResponse.js";

import {deleteAvatar} from "@services/deleteAvatar.js";
import {modelMap} from "@services/modelMap.js";

export const adminUserRouter = Router();

adminUserRouter.get('/all', asyncHandler(async (req: Request, res: Response) => {
    const {page, limit} = pageLimitSchema.parse(req.query)

    const skip = getSkip(page, limit)

    let [users, total] = await Promise.all([
        db.user.findMany({
            select: {
                id: true,
                name: true,
                login: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
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

adminUserRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const user = await userServiceGetUserFromDB(id)
    if (!user) throw userException

    res.json(user)
}))

adminUserRouter.patch('/redact_name/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await userServiceGetUserAndRedact(req, res, userServiceRedactName)
}))

const loginSchema = z.object({
    login: z.string(),
})
adminUserRouter.patch('/redact_login/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
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

adminUserRouter.patch('/redact_password/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await userServiceGetUserAndRedact(req, res, userServiceRedactPassword)
}))

adminUserRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    await db.user.delete({
        where: {
            id
        }
    })

    successResponse(res)
}))

adminUserRouter.post('/upload_avatar/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const user = await userServiceGetUserFromDB(id)
    if (!user) throw userException

    await userServiceUploadAvatar(req, res, user)
}))

adminUserRouter.patch('/delete_avatar/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await deleteAvatar(req, res, modelMap.user, userException)
}))