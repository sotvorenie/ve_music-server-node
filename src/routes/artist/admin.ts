import { type Request, type Response } from 'express';
import path from "node:path";
import fs from "node:fs/promises";
import multer from "multer";
import {db} from "@/db.js";
import {artistRouter} from "@routes/artist/index.js";

import {ALLOWED_PHOTO_SUFFIX, ARTISTS_AVATARS_DIRECTORY} from "@/config.js";

import {uploadStorage} from "@composables/useUploadStorage.js";
import {createUrl} from "@composables/useCreateUrl.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";
import {
    artistException,
    emptyUserDataException,
    photoFormatException
} from "@utils/httpExceptions.js";

import {idSchema} from "@schemas/idSchema.js";
import {urlSchema} from "@schemas/urlSchema.js";

import {getAllMusic} from "@services/getMusicService.js";
import {modelMap} from "@services/modelMap.js";
import {createInDB} from "@services/createService.js";
import {deleteFromDB} from "@services/deleteService.js";
import {redactNameInDB} from "@services/redactNameService.js";
import {deleteAvatar} from "@services/deleteAvatar.js";
import {successResponse} from "@responses/successResponse.js";

artistRouter.get('/music/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await getAllMusic(req, res, modelMap.artist)
}))

artistRouter.post('/create', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await createInDB(req, res, modelMap.artist)
}))

artistRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await deleteFromDB(req, res, modelMap.artist)
}))

artistRouter.patch('/redact_name/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await redactNameInDB(req, res, modelMap.artist)
}))

const upload = multer({storage: uploadStorage})
artistRouter.post(
    '/upload_avatar/:id',
    getAdmin(),
    upload.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const {id} = idSchema.parse(req.params)

        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        const avatarFile = files?.avatar?.[0]

        if (!avatarFile) throw emptyUserDataException

        const artist = await db.artist.findUnique({
            where: {
                id
            },
            select: {
                avatarUrl: true,
            }
        })
        if (!artist) throw artistException

        const avatarSuffix = path.extname(avatarFile.originalname).toLowerCase()
        if (!ALLOWED_PHOTO_SUFFIX.has(avatarSuffix)) throw photoFormatException

        let targetAvatarPath: string | null = null

        try {
            await fs.mkdir(ARTISTS_AVATARS_DIRECTORY, {recursive: true})

            targetAvatarPath = path.join(ARTISTS_AVATARS_DIRECTORY, `${id}_${Date.now()}${avatarSuffix}`)
            await fs.rename(avatarFile.path, targetAvatarPath)

            const newAvatarUrl = createUrl(targetAvatarPath)
            await db.artist.update({
                where: {
                    id
                },
                data: {
                    avatarUrl: newAvatarUrl,
                }
            })

            if (artist.avatarUrl) {
                const oldAvatarName = artist.avatarUrl.replace('/static/', '')
                const oldAvatarPath = path.join(ARTISTS_AVATARS_DIRECTORY, oldAvatarName)

                try {
                    await fs.unlink(oldAvatarPath)
                } catch (err: any) {
                    if (err.code === 'ENOENT') {
                        console.log('Старый файл аватарки не найден, пропускаем удаление')
                    } else {
                        console.error('Ошибка при удалении аватарки:', err)
                    }
                }
            }

            res.status(201).json({
                url: newAvatarUrl
            })
        } catch (err) {
            if (targetAvatarPath) await fs.unlink(targetAvatarPath).catch()

            await fs.unlink(files?.avatar?.[0]?.path ?? '').catch()

            throw err
        }
    })
)

artistRouter.post('/redact_avatar_url/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {url} = urlSchema.parse(req.body)

    await db.artist.update({
        where: {
            id
        },
        data: {
            avatarUrl: url
        }
    })

    successResponse(res)
}))

artistRouter.patch('/delete_avatar', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await deleteAvatar(req, res, modelMap.artist, artistException)
}))