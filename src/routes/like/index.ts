import { Router, type Request, type Response } from 'express';

import {adminLikeRouter} from "@routes/like/admin.js";

import {likeService} from "@routes/like/services.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";

import {getAllUserMusic} from "@services/getAllUserMusicService.js";
import {modelMap} from "@services/modelMap.js";
import {idSchema} from "@schemas/idSchema.js";
import {db} from "@/db.js";

export const likeRouter = Router();

likeRouter.get('/list', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id
    await getAllUserMusic(req, res, modelMap.like, currentUserId)
}))

likeRouter.post('/:id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await likeService(req, res, currentUserId)
}))

likeRouter.get('/check/:id', getUser(), asyncHandler(async (req: Request, res: Response) => {
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

    res.json({
        isLiked: !!existingLike
    })
}))

likeRouter.use('/', adminLikeRouter)