import { Router, type Request, type Response } from 'express';
import {db} from "../db.js";

import {asyncHandler} from "../utils/asyncHandler.js";
import {getAdmin, getUser} from "../utils/auth.js";
import {getAllUserMusic} from "../services/getAllUserMusicService.js";
import {idSchema} from "../schemas/idSchema.js";
import {modelMap} from "../services/modelMap.js";
import {musicException} from "../utils/httpExceptions.js";
import {successResponse} from "../responses/successResponse.js";

export const likeRouter = Router();

likeRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id
    await getAllUserMusic(req, res, modelMap.like, currentUserId)
}))

likeRouter.post('/:id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const currentUserId = req.user!.id

    const existingLike = await db.like.findUnique({
        where: {
            userId_musicId: {
                userId: currentUserId,
                musicId: id
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
                        musicId: id
                    }
                }
            })
            await tx.music.update({
                where: {
                    id
                },
                data: {
                    likesCount: {decrement: 1}
                }
            })
        } else {
            await tx.like.create({
                data: {
                    userId: currentUserId,
                    musicId: id,
                }
            })
            await tx.music.update({
                where: {
                    id
                },
                data: {
                    likesCount: {increment: 1}
                }
            })
            isLiked = true
        }
    })

    res.json({
        isLiked,
    })
}))


// --- для админки --- //
likeRouter.get('/all_from_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    await getAllUserMusic(req, res, modelMap.like, id)
}))

likeRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const music = await db.like.findUnique({
        where: {
            id
        },
        select: {
            musicId: true
        }
    })
    const musicId = music?.musicId
    if (!musicId) throw musicException

    await db.$transaction(async (tx) => {
        await tx.like.delete({
            where: {
                id
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
    })

    successResponse(res)
}))