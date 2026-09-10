import { Router, type Request, type Response } from 'express';
import multer from 'multer';

import {adminUserRouter} from "@routes/user/admin.js";
import {userServiceRedactName, userServiceRedactPassword, userServiceUploadAvatar} from "@routes/user/services.js";

import {uploadStorage} from "@composables/useUploadStorage.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";
import {deleteAvatar} from "@services/deleteAvatar.js";
import {modelMap} from "@services/modelMap.js";
import {userException} from "@utils/httpExceptions.js";

export const userRouter = Router();

userRouter.patch('/redact_name', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUser = req.user!
    await userServiceRedactName(req, res, currentUser)
}))

userRouter.patch('/redact_password', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUser = req.user!
    await userServiceRedactPassword(req, res, currentUser)
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
        await userServiceUploadAvatar(req, res, currentUser)
    })
)

userRouter.patch('/delete_avatar', getUser(), asyncHandler(async (req: Request, res: Response) => {
    await deleteAvatar(req, res, modelMap.user, userException, true)
}))

userRouter.use('/', adminUserRouter)