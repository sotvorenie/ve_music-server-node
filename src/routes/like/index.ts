import { Router, type Request, type Response } from 'express';

import {adminLikeRouter} from "@routes/like/admin.js";
import {like} from "@routes/like/services/helpers.js";
import {checkIsLiked} from "@routes/like/services/index.js";

import {getHasMore} from "@composables/useGetHasMore.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";

import {getUserMusic} from "@services/getUserMusic.js";
import {modelMap} from "@services/modelMap.js";

import {idSchema} from "@schemas/idSchema.js";
import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {nameOptionalSchema} from "@schemas/nameSchema.js";

export const likeRouter = Router();

likeRouter.get('/list', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, name} = pageLimitSchema.extend(nameOptionalSchema.shape).parse(req.query)
    const currentUserId = req.user!.id

    const {music, total, skip} = await getUserMusic(currentUserId, page, limit, name, modelMap.like)

    res.json({
        data: music,
        meta: {
            page,
            limit,
            total,
            hasMore: getHasMore(skip, limit, total),
        },
    })
}))

likeRouter.post('/:id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const currentUserId = req.user!.id

    const isLiked = await like(id, currentUserId)

    res.json({
        isLiked,
    })
}))

likeRouter.get('/check/:id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const currentUserId = req.user!.id

    const isLiked = await checkIsLiked(id, currentUserId)

    res.json({
        isLiked,
    })
}))

likeRouter.use('/admin', adminLikeRouter)