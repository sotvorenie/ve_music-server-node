import { Router, type Request, type Response } from 'express';
import multer from 'multer';

import {adminUserRouter} from "@routes/user/admin.js";
import {updateUserName, updateUserPassword, uploadUserAvatar} from "@routes/user/services/helpers.js";
import {oldPasswordSchema} from "@routes/user/schemas.js";
import {logoutAll} from "@routes/user/services/index.js";

import {uploadStorage} from "@utils/uploadStorage.js";
import {cleanupTempFiles} from "@utils/cleanupTempFiles.js";
import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";
import {emptyUserDataException, userException} from "@utils/httpExceptions.js";

import {modelMap} from "@services/modelMap.js";
import {deleteAvatar} from "@services/deleteAvatar.js";

import {nameSchema} from "@schemas/nameSchema.js";
import {passwordSchema} from "@schemas/passwordSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const userRouter = Router();

userRouter.patch('/update_name', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {name} = nameSchema.parse(req.body)
    const currentUserId = req.user!.id

    await updateUserName(currentUserId, name)

    successResponse(res)
}))

userRouter.patch('/update_password', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {password, old_password: oldPassword} = passwordSchema.extend(oldPasswordSchema.shape).parse(req.body)
    const currentUser = req.user!

    await updateUserPassword(currentUser.id, password, oldPassword)

    successResponse(res)
}))

const upload = multer({storage: uploadStorage})
userRouter.post(
    '/upload_avatar',
    getUser(),
    upload.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    cleanupTempFiles,
    asyncHandler(async (req: Request, res: Response) => {
        const currentUser = req.user!

        const files = req.files as Record<string, Express.Multer.File[]> | undefined
        const avatarFile = files?.avatar?.[0]

        if (!avatarFile) throw emptyUserDataException


        const newAvatarUrl = await uploadUserAvatar(currentUser, avatarFile)

        res.status(201).json({
            url: newAvatarUrl,
        })
    })
)

userRouter.patch('/delete_avatar', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUser = req.user!

    await deleteAvatar(currentUser.id, modelMap.user, userException)

    successResponse(res)
}))

userRouter.post('/logout-all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUser = req.user!

    await logoutAll(currentUser.id)

    successResponse(res)
}))

userRouter.use('/admin', adminUserRouter)