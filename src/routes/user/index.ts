import { Router, type Request, type Response } from 'express';
import multer from 'multer';

import {adminUserRouter} from "@routes/user/admin.js";
import {updateUserName, updateUserPassword, uploadUserAvatar} from "@routes/user/services/helpers.js";

import {uploadStorage} from "@utils/uploadStorage.js";
import {cleanupTempFiles} from "@utils/cleanupTempFiles.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";
import {emptyUserDataException, userException} from "@utils/httpExceptions.js";

import {modelMap} from "@services/modelMap.js";
import {deleteAvatar} from "@services/deleteAvatar.js";

import {nameSchema} from "@schemas/nameSchema.js";
import {passwordSchema} from "@schemas/passwordSchema.js";
import {idSchema} from "@schemas/idSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const userRouter = Router();

userRouter.patch('/update_name', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {name} = nameSchema.parse(req.body)
    const currentUserId = req.user!.id

    await updateUserName(currentUserId, name)

    return successResponse(res)
}))

userRouter.patch('/update_password', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {password} = passwordSchema.parse(req.body)
    const currentUser = req.user!

    await updateUserPassword(currentUser.id, password)

    return successResponse(res)
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
    const {id} = idSchema.parse(req.params)

    await deleteAvatar(id, modelMap.user, userException)

    successResponse(res)
}))

userRouter.use('/admin', adminUserRouter)