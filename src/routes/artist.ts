import { Router, type Request, type Response } from 'express';
import {z} from "zod";
import path from "node:path";
import fs from "node:fs/promises";
import multer from "multer";
import {db} from "../db.js";

import {asyncHandler} from "../utils/asyncHandler.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {getSkip} from "../composables/useGetSkip.js";
import {getHasMore} from "../composables/useGetHasMore.js";
import {artistFullSelect} from "../selects/artistSelect.js";
import {nameSchema} from "../schemas/nameSchema.js";
import {getAdmin} from "../utils/auth.js";
import {uploadStorage} from "../composables/useUploadStorage.js";
import {artistException, emptyUserDataException, photoFormatException} from "../utils/httpExceptions.js";
import {ALLOWED_PHOTO_SUFFIX, ARTISTS_AVATARS_DIRECTORY} from "../config.js";
import {createUrl} from "../composables/useCreateUrl.js";
import {userRouter} from "./user.js";
import {successResponse} from "../responses/successResponse.js";

export const artistRouter = Router();

artistRouter.get('/all', asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = pageLimitSchema.parse(req.query)

    const skip = getSkip(page, limit)

    const [artists, total] = await Promise.all([
        db.artist.findMany({
            select: artistFullSelect,
            skip,
            take: limit,
        }),
        db.artist.count()
    ])

    res.json({
        artists,
        page,
        limit,
        total,
        hasMore: getHasMore(skip, limit, total),
    })
}))

const searchArtistsQuerySchema = pageLimitSchema.extend(nameSchema.shape)
artistRouter.get('/search', asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, name } = searchArtistsQuerySchema.parse(req.query)

    const skip = getSkip(page, limit)

    const where = {
        name: {
            contains: name,
            mode: 'insensitive' as const
        }
    }

    const [artists, total] = await Promise.all([
        db.artist.findMany({
            where,
            select: artistFullSelect,
            skip,
            take: limit,
        }),
        db.artist.count({where})
    ])

    res.json({
        artists,
        page,
        limit,
        total,
        hasMore: getHasMore(skip, limit, total),
    })
}))


// --- для админки --- //
const artistIdSchema = z.object({
    artist_id: z.string().transform(Number),
})

artistRouter.post('/create', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {name} = nameSchema.parse(req.body)

    const newArtist = await db.artist.create({
        data: {
            name,
        },
        select: {
            id: true,
            name: true,
        }
    })

    res.status(201).json(newArtist)
}))

const upload = multer({storage: uploadStorage})
userRouter.post(
    '/upload_avatar/:artist_id',
    getAdmin(),
    upload.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const {artist_id: artistId} = artistIdSchema.parse(req.params)

        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        const avatarFile = files?.avatar?.[0]

        if (!avatarFile) throw emptyUserDataException

        const artist = await db.artist.findUnique({
            where: {
                id: artistId
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

            targetAvatarPath = path.join(ARTISTS_AVATARS_DIRECTORY, `${artistId}_${Date.now()}${avatarSuffix}`)
            await fs.rename(avatarFile.path, targetAvatarPath)

            const newAvatarUrl = createUrl(targetAvatarPath)
            await db.artist.update({
                where: {
                    id: artistId
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
                newAvatarUrl: newAvatarUrl
            })
        } catch (err) {
            if (targetAvatarPath) await fs.unlink(targetAvatarPath).catch()

            await fs.unlink(files?.avatar?.[0]?.path ?? '').catch()

            throw err
        }
    })
)

artistRouter.delete('/delete', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {artist_id: artistId} = artistIdSchema.parse(req.params)

    await db.artist.delete({
        where: {
            id: artistId
        }
    })

    successResponse(res)
}))

artistRouter.patch('/redact_name', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {artist_id: artistId} = artistIdSchema.parse(req.params)
    const {name} = nameSchema.parse(req.body)

    await db.artist.update({
        where: {
            id: artistId
        },
        data: {
            name
        }
    })

    successResponse(res)
}))
