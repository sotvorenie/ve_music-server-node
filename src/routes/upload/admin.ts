import {Router} from 'express';
import multer from 'multer';

import {uploadAudio, uploadMusic, uploadPreview, uploadVideo} from "@routes/upload/services/index.js";

import {uploadStorage} from "@composables/useUploadStorage.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getAdmin} from "@utils/auth.js";

export const uploadRouter = Router();

const upload = multer({storage: uploadStorage})

uploadRouter.post(
    '/music',
    getAdmin(),
    upload.fields([
        {name: 'music', maxCount: 1},
        {name: 'preview', maxCount: 1},
        {name: 'video', maxCount: 1},
    ]),
    asyncHandler(uploadMusic)
)

uploadRouter.post(
    '/audio/:id',
    getAdmin(),
    upload.fields([
        {name: 'music', maxCount: 1},
    ]),
    asyncHandler(uploadAudio)
)

uploadRouter.post(
    '/preview/:id',
    getAdmin(),
    upload.fields([
        {name: 'preview', maxCount: 1},
    ]),
    asyncHandler(uploadPreview)
)

uploadRouter.post(
    '/video/:id',
    getAdmin(),
    upload.fields([
        {name: 'video', maxCount: 1},
    ]),
    asyncHandler(uploadVideo)
)