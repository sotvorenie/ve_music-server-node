import { Router, type Request, type Response } from 'express';
import {db} from "../db.js";

import {asyncHandler} from "../utils/asyncHandler.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {getSkip} from "../composables/useGetSkip.js";
import {getUser} from "../utils/auth.js";
import {musicException} from "../utils/httpExceptions.js";
import {musicBaseWithArtistsSelect} from "../selects/musicSelect.js";
import {musicIdSchema} from "../schemas/musicIdSchema.js";

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

musicRouter.get('/all', asyncHandler(async (req: Request, res: Response) => {
    const {page, limit} = pageLimitSchema.parse(req.query)

    const skip = getSkip(page, limit)

    const [music, total] = await Promise.all([
        db.music.findMany({
            skip,
            take: limit,
            select: musicBaseWithArtistsSelect
        }),
        db.music.count()
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
        music: musicFromDB,
        isLiked: !!musicFromDB?.likes?.length,
        likes: undefined,
    }

    res.json(music)
}))
