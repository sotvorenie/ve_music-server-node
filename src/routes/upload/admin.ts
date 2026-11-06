import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises'
import {db} from "@/db.js";

import {
    ALLOWED_PHOTO_SUFFIX,
    ALLOWED_VIDEO_SUFFIX,
    MUSIC_DIRECTORY,
    segmentTime
} from "@/config.js";

import {uploadServiceUpdateAudio, uploadServiceUploadAudio, uploadServiceUploadFile} from "@routes/upload/services.js";
import {uploadConstantTypes} from "@routes/upload/constants.js";

import {uploadStorage} from "@composables/useUploadStorage.js";
import {createUrl} from "@composables/useCreateUrl.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getAdmin} from "@utils/auth.js";
import {
    emptyMusicDataException,
    photoFormatException, videoFormatException
} from "@utils/httpExceptions.js";

import {musicInfoSchema} from "@schemas/musicInfoSchema.js";
import {pathSchema} from "@schemas/pathSchema.js";

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
    asyncHandler(async (req: Request, res: Response) => {
        const { title, genre_id: genreId, artists, path: previewPath } = musicInfoSchema.extend(pathSchema.shape).parse(req.body)

        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        const musicFile = files?.music?.[0]
        const previewFile = files?.preview?.[0]
        const videoFile = files?.video?.[0]

        if (!musicFile) throw emptyMusicDataException

        let previewSuffix: string = ''
        if (previewFile) {
            previewSuffix = path.extname(previewFile.originalname).toLowerCase()
            if (!ALLOWED_PHOTO_SUFFIX.has(previewSuffix)) throw photoFormatException
        }

        let videoSuffix: string = ''
        if (videoFile) {
            videoSuffix = path.extname(videoFile.originalname).toLowerCase()
            if (!ALLOWED_VIDEO_SUFFIX.has(videoSuffix)) throw videoFormatException
        }

        let targetPreviewPath: string | null = null
        let targetVideoPath: string | null = null

        try {
            const previewsDirectory = path.join(MUSIC_DIRECTORY, 'previews')
            const videosDirectory = path.join(MUSIC_DIRECTORY, 'videos')

            req.checkAborted()

            await fs.mkdir(previewsDirectory, {recursive: true})
            await fs.mkdir(videosDirectory, {recursive: true})

            req.checkAborted()

            req.checkAborted()
            if (previewFile) {
                targetPreviewPath = path.join(previewsDirectory, `${Date.now()}${previewSuffix}`)
                await fs.rename(previewFile.path, targetPreviewPath)
            }

            req.checkAborted()
            if (videoFile) {
                targetVideoPath = path.join(videosDirectory, `${Date.now()}${videoSuffix}`)
                await fs.rename(videoFile.path, targetVideoPath)
            }

            req.checkAborted()

            req.checkAborted()

            const {id, segmentsCount, bitrates} = await uploadServiceUploadAudio(
                musicFile,
                title,
                genreId,
                artists,
                'aac',
                segmentTime,
                req,
            )

            const newMusic = await db.music.update({
                where: {
                    id
                },
                data: {
                    url: createUrl(path.join(MUSIC_DIRECTORY, 'music', String(id), 'master.m3u8')),
                    previewUrl: previewPath ? previewPath : targetPreviewPath ? createUrl(targetPreviewPath) : '',
                    videoClipUrl: targetVideoPath ? createUrl(targetVideoPath) : '',
                    status: 'READY',
                    segmentsCount,
                    bitrates,
                }
            })

            res.status(201).json(newMusic)
        } catch (err) {
            if (targetPreviewPath) await fs.unlink(targetPreviewPath).catch()
            if (targetVideoPath) await fs.unlink(targetVideoPath).catch()

            await fs.unlink(files?.music?.[0]?.path ?? '').catch()
            await fs.unlink(files?.preview?.[0]?.path ?? '').catch()
            await fs.unlink(files?.video?.[0]?.path ?? '').catch()

            throw err
        }
    })
)

const uploadMusic = multer({storage: uploadStorage})
uploadRouter.post(
    '/audio/:id',
    getAdmin(),
    uploadMusic.fields([
        {name: 'music', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        await uploadServiceUpdateAudio(req, res, segmentTime)
    })
)

const uploadPreview = multer({storage: uploadStorage})
uploadRouter.post(
    '/preview/:id',
    getAdmin(),
    uploadPreview.fields([
        {name: 'preview', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        await uploadServiceUploadFile(req, res, uploadConstantTypes.preview)
    })
)

const uploadVideo = multer({storage: uploadStorage})
uploadRouter.post(
    '/video/:id',
    getAdmin(),
    uploadVideo.fields([
        {name: 'video', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        await uploadServiceUploadFile(req, res, uploadConstantTypes.video)
    })
)
