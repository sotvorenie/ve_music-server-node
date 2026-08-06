import { Router, type Request, type Response } from 'express';
import {db} from "../db.js";

import {asyncHandler} from "../utils/asyncHandler.js";
import {getUser} from "../utils/auth.js";
import {musicIdSchema} from "../schemas/musicIdSchema.js";
import {getAllMusic, modelMap} from "../services/getAllMusicService.js";

export const likeRouter = Router();

likeRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    await getAllMusic(req, res, modelMap.like)
}))

likeRouter.post('/:music_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {music_id: musicId} = musicIdSchema.parse(req.params)
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
