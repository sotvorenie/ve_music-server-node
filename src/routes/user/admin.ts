import {Router, type Request, type Response} from "express";
import multer from "multer";

import {roleSchema} from "@routes/user/schemas.js";
import {deleteUser, getUsers, updateUserLogin, updateUserRole} from "@routes/user/services/index.js";
import {getUser, updateUserName, updateUserPassword, uploadUserAvatar} from "@routes/user/services/helpers.js";

import {getHasMore} from "@composables/useGetHasMore.js";
import {uploadStorage} from "@utils/uploadStorage.js";
import {cleanupTempFiles} from "@utils/cleanupTempFiles.js";

import {emptyUserDataException, userException} from "@utils/httpExceptions.js";
import {asyncHandler} from "@utils/asyncHandler.js";
import {getAdmin} from "@utils/auth.js";

import {deleteAvatar} from "@services/deleteAvatar.js";
import {modelMap} from "@services/modelMap.js";

import {idSchema} from "@schemas/idSchema.js";
import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {nameOptionalSchema, nameSchema} from "@schemas/nameSchema.js";
import {loginSchema} from "@schemas/loginSchema.js";
import {passwordSchema} from "@schemas/passwordSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminUserRouter = Router();

adminUserRouter.get('/list', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, name} = pageLimitSchema.extend(nameOptionalSchema.shape).parse(req.query)

    const {users, total, skip} = await getUsers(name, page, limit)

    res.json({
        data: users,
        meta: {
            page,
            limit,
            total,
            hasMore: getHasMore(skip, limit, total),
        },
    })
}))

adminUserRouter.get('/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const user = await getUser(id)
    if (!user) throw userException

    res.json(user)
}))

adminUserRouter.patch('/update_name/:id', getAdmin(), asyncHandler(async (req: Request, _: Response) => {
    const {id: userId} = idSchema.parse(req.params)
    const {name} = nameSchema.parse(req.body)

    await updateUserName(userId, name)
}))

adminUserRouter.patch('/update_login/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {login} = loginSchema.parse(req.body)
    const {id: userId} = idSchema.parse(req.params)

    await updateUserLogin(userId, login)

    return successResponse(res)
}))

adminUserRouter.patch('/update_password/:id', getAdmin(), asyncHandler(async (req: Request, _: Response) => {
    const {id: userId} = idSchema.parse(req.params)
    const {password} = passwordSchema.parse(req.body)

    const user = await getUser(userId)
    if (!user) throw userException

    await updateUserPassword(user, password)
}))

adminUserRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    await deleteUser(id)

    successResponse(res)
}))

const upload = multer({storage: uploadStorage})
adminUserRouter.post(
    '/upload_avatar/:id',
    getAdmin(),
    upload.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    cleanupTempFiles,
    asyncHandler(async (req: Request, res: Response) => {
    const {id: userId} = idSchema.parse(req.params)

    const files = req.files as Record<string, Express.Multer.File[]> | undefined
    const avatarFile = files?.avatar?.[0]

    if (!avatarFile) throw emptyUserDataException

    const user = await getUser(userId)
    if (!user) throw userException

    await uploadUserAvatar(user, avatarFile)

    successResponse(res)
}))

adminUserRouter.patch('/delete_avatar/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id: userId} = idSchema.parse(req.params)

    await deleteAvatar(userId, modelMap.user, userException)

    successResponse(res)
}))

adminUserRouter.patch('/update_role/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {role} = roleSchema.parse(req.body)

    await updateUserRole(id, role)

    successResponse(res)
}))