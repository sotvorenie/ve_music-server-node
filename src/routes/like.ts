import { Router, type Request, type Response } from 'express';
import {z} from "zod";
import {db} from "../db.js";

import {asyncHandler} from "../utils/asyncHandler.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {getSkip} from "../composables/useGetSkip.js";
import {getUser} from "../utils/auth.js";

export const likeRouter = Router();

likeRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {page, limit} = pageLimitSchema.parse(req.query)
    const currentUserId = req.user!.id

    const skip = getSkip(page, limit)

    const [music, total] = await Promise.all([
        db.like.findMany({
            where: {
                userId: currentUserId
            },
            select: {
                music: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        artists: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            },
            skip,
            take: limit,
        }),
        db.history.count({
            where: {
                userId: currentUserId
            }
        })
    ])

    res.json({
        music,
        page,
        limit,
        total,
        hasMore: (skip + limit) < total,
    })
}))

const likeParamsSchema = z.object({
    music_id: z.string().transform(Number)
})
likeRouter.post('/:music_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {music_id: musicId} = likeParamsSchema.parse(req.params)
    const currentUserId = req.user!.id

    const existingLike = await db.like.findUnique({
        where: {
            userId_musicId: {
                userId: currentUserId,
                musicId
            }
        }
    })

    let isLiked = false

    await db.$transaction(async (tx) => {
        if (existingLike) {
            await tx.like.delete({
                where: {
                    userId_musicId: {
                        userId: currentUserId,
                        musicId
                    }
                }
            })
            await tx.music.update({
                where: {
                    id: musicId
                },
                data: {
                    likesCount: {decrement: 1}
                }
            })
        } else {
            await tx.like.create({
                data: {
                    userId: currentUserId,
                    musicId,
                }
            })
            await tx.music.update({
                where: {
                    id: musicId
                },
                data: {
                    likesCount: {increment: 1}
                }
            })
            isLiked = true
        }
    })

    res.json({
        isLiked: isLiked,
    })
}))
