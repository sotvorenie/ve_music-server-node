import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises'
import {db} from "@/db.js";

import {uploadServiceUploadFile} from "@routes/upload/services.js";
import {uploadConstantTypes} from "@routes/upload/constants.js";

import {
    ALLOWED_MUSIC_SUFFIX,
    ALLOWED_PHOTO_SUFFIX,
    ALLOWED_VIDEO_SUFFIX,
    MUSIC_DIRECTORY
} from "@/config.js";

import {uploadStorage} from "@composables/useUploadStorage.js";
import {createUrl} from "@composables/useCreateUrl.js";
import {getMusicDuration} from "@composables/useGetAudioDuration.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";
import {
    audioFormatException,
    emptyMusicDataException,
    photoFormatException, videoFormatException
} from "@utils/httpExceptions.js";

import {musicInfoSchema} from "@schemas/musicInfoSchema.js";

export const uploadRouter = Router();

const upload = multer({storage: uploadStorage})
uploadRouter.post(
    '/music',
    getUser(),
    upload.fields([
        {name: 'music', maxCount: 1},
        {name: 'preview', maxCount: 1},
        {name: 'video', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const { title, genre_id: genreId, artists } = musicInfoSchema.parse(req.body)

        req.checkAborted()

        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        const musicFile = files?.music?.[0]
        const previewFile = files?.preview?.[0]
        const videoFile = files?.video?.[0]

        if (!musicFile) throw emptyMusicDataException

        const musicSuffix = path.extname(musicFile.originalname).toLowerCase()
        if (!ALLOWED_MUSIC_SUFFIX.has(musicSuffix)) throw audioFormatException

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

        let targetMusicPath: string | null = null
        let targetPreviewPath: string | null = null
        let targetVideoPath: string | null = null

        try {
            const musicDirectory = path.join(MUSIC_DIRECTORY, 'music')
            const previewsDirectory = path.join(MUSIC_DIRECTORY, 'previews')
            const videosDirectory = path.join(MUSIC_DIRECTORY, 'videos')

            req.checkAborted()

            await fs.mkdir(musicDirectory, {recursive: true})
            await fs.mkdir(previewsDirectory, {recursive: true})
            await fs.mkdir(videosDirectory, {recursive: true})

            req.checkAborted()

            targetMusicPath = path.join(musicDirectory, `${Date.now()}${musicSuffix}`)
            await fs.rename(musicFile.path, targetMusicPath)

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

            const musicUrl = createUrl(targetMusicPath)
            const musicDuration = await getMusicDuration(targetMusicPath)

            req.checkAborted()

            const newMusic = await db.music.create({
                data: {
                    name: title,
                    url: musicUrl,
                    duration: musicDuration,
                    previewUrl: targetPreviewPath ? createUrl(targetPreviewPath) : '',
                    videoClipUrl: targetVideoPath ? createUrl(targetVideoPath) : '',
                    genreId,
                    ...(artists.length > 0 && {
                        artists: {
                            connect: artists.map(artistId => ({ id: artistId }))
                        }
                    })
                }
            })

            res.status(201).json(newMusic)
        } catch (err) {
            if (targetMusicPath) await fs.unlink(targetMusicPath).catch()
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
    getUser(),
    uploadMusic.fields([
        {name: 'music', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        await uploadServiceUploadFile(req, res, uploadConstantTypes.audio)
    })
)

const uploadPreview = multer({storage: uploadStorage})
uploadRouter.post(
    '/preview/:id',
    getUser(),
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
    getUser(),
    uploadVideo.fields([
        {name: 'video', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        await uploadServiceUploadFile(req, res, uploadConstantTypes.video)
    })
)
