import { Router, type Request, type Response } from 'express';
import {z} from "zod";
import {db} from "../db.js";

import {asyncHandler} from "../utils/asyncHandler.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {getSkip} from "../composables/useGetSkip.js";
import {getUser} from "../utils/auth.js";
import {musicException} from "../utils/httpExceptions.js";
import {musicBaseWithArtistsSelect} from "../selects/musicSelect.js";
import {musicIdSchema} from "../schemas/musicIdSchema.js";
import {nameSchema} from "../schemas/nameSchema.js";

export const musicRouter = Router();

const addMusicToHistory = async (userId: number, musicId: number) => {
    const historyEntry = await db.history.findUnique({
        where: {
            userId_musicId: {
                userId,
                musicId
            }
        }
    })

    if (historyEntry) {
        await db.history.update({
            where: {
                id: historyEntry.id
            },
            data: {
                date: new Date()
            }
        })
    } else {
        await db.history.create({
            data: {
                userId,
                musicId
            }
        })

        const total = await db.history.count({
            where: {userId}
        })
        if (total > 100) {
            const oldest = await db.history.findFirst({
                where: {userId},
                orderBy: {date: 'asc'},
                select: {id: true}
            })
            if (oldest) {
                await db.history.delete({
                    where: {
                        id: oldest.id
                    }
                })
            }
        }
    }
}

const getMusicListSchema = pageLimitSchema.extend(nameSchema.shape).extend({
    genre_id: z.string().transform(Number),
    artist_id: z.string().transform(Number),
})
musicRouter.get('/list', asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, name, genre_id: genreId, artist_id: artistId} = getMusicListSchema.parse(req.query)

    const skip = getSkip(page, limit)

    const where = {
        ...(name && {
            name: {
                contains: name,
                mode: 'insensitive' as const
            }
        }),
        ...(genreId >= 0 && { genreId }),
        ...(artistId >= 0 && {
            artists: {
                some: {
                    id: artistId
                }
            }
        })
    }

    const [music, total] = await Promise.all([
        db.music.findMany({
            where,
            skip,
            take: limit,
            select: musicBaseWithArtistsSelect
        }),
        db.music.count({where})
    ])

    res.json({
        music,
        page,
        limit,
        total,
        hasMore: (skip + limit) < total,
    })
}))

musicRouter.get('/:music_id', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const {music_id: musicId} = musicIdSchema.parse(req.params)
    const currentUserId = req.user?.id

    if (currentUserId) addMusicToHistory(currentUserId, musicId).then()

    let [musicFromDB] = await Promise.all([
        db.music.findUnique({
            where: {
                id: musicId
            },
            select: {
                ...musicBaseWithArtistsSelect,
                url: true,
                previewUrl: true,
                videoClipUrl: true,
                likesCount: true,
                auditionsCount: true,
                likes: {
                    where: {
                        userId: currentUserId ?? -1
                    }
                }
            }
        }),
        db.music.update({
            where: {
                id: musicId
            },
            data: {
                auditionsCount: {increment: 1}
            }
        })
    ])

    if (!musicFromDB) throw musicException

    const music = {
        ...musicFromDB,
        isLiked: !!musicFromDB?.likes?.length,
        likes: undefined,
    }

    res.json(music)
}))
