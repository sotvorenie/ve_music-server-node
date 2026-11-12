import {Router, type Request, type Response} from 'express';
import multer from 'multer';

import {uploadAudio, uploadMusic, uploadPreview, uploadVideo} from "@routes/upload/services/index.js";

import {uploadStorage} from "@utils/uploadStorage.js";
import {cleanupTempFiles} from "@utils/cleanupTempFiles.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getAdmin} from "@utils/auth.js";
import {emptyMusicDataException} from "@utils/httpExceptions.js";

import {idSchema} from "@schemas/idSchema.js";
import {musicInfoSchema} from "@schemas/musicInfoSchema.js";
import {pathSchema} from "@schemas/pathSchema.js";

import {pendingResponse} from "@responses/pendingResponse.js";

export const uploadRouter = Router();
uploadRouter.use(getAdmin())

const upload = multer({storage: uploadStorage})

uploadRouter.post(
    '/music',
    upload.fields([
        {name: 'music', maxCount: 1},
        {name: 'preview', maxCount: 1},
        {name: 'video', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const { name, genre_id: genreId, artists, path: previewPath } = musicInfoSchema.extend(pathSchema.shape).parse(req.body)

        const files = req.files as Record<string, Express.Multer.File[]> | undefined
        const musicFile = files?.music?.[0]
        const previewFile = files?.preview?.[0]
        const videoFile = files?.video?.[0]

        if (!musicFile) throw emptyMusicDataException

        await uploadMusic(
            genreId,
            artists,
            name,
            previewPath,
            {
                music: musicFile,
                preview: previewFile,
                video: videoFile,
            }
        )

        pendingResponse(res)
    })
)

uploadRouter.post(
    '/audio/:id',
    upload.fields([
        {name: 'music', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const {id} = idSchema.parse(req.params)

        const files = req.files as Record<string, Express.Multer.File[]> | undefined
        const file = files?.music?.[0]

        if (!file) throw emptyMusicDataException

        await uploadAudio(id, file)

        pendingResponse(res)
    })
)

uploadRouter.post(
    '/preview/:id',
    upload.fields([
        {name: 'preview', maxCount: 1},
    ]),
    cleanupTempFiles,
    asyncHandler(async (req: Request, res: Response) => {
        const {id} = idSchema.parse(req.params)

        const files = req.files as Record<string, Express.Multer.File[]> | undefined
        const file = files?.preview?.[0]

        if (!file) throw emptyMusicDataException

        const url = await uploadPreview(id, file)

        res.status(201).json({
            url,
        })
    })
)

uploadRouter.post(
    '/video/:id',
    upload.fields([
        {name: 'video', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const {id} = idSchema.parse(req.params)

        const files = req.files as Record<string, Express.Multer.File[]> | undefined
        const file = files?.video?.[0]

        if (!file) throw emptyMusicDataException

        await uploadVideo(id, file)

        pendingResponse(res)
    })
)