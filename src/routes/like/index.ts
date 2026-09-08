import { Router, type Request, type Response } from 'express';

import {adminLikeRouter} from "@routes/like/admin.js";

import {likeService} from "@routes/like/services.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";

import {getAllUserMusic} from "@services/getAllUserMusicService.js";
import {modelMap} from "@services/modelMap.js";

export const likeRouter = Router();

likeRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id
    await getAllUserMusic(req, res, modelMap.like, currentUserId)
}))

likeRouter.post('/:id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await likeService(req, res, currentUserId)
}))

likeRouter.use('/', adminLikeRouter)