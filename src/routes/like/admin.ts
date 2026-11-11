import { type Request, type Response, Router } from 'express';

import {like} from "@routes/like/services/helpers.js";

import {getHasMore} from "@composables/useGetHasMore.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";

import {idSchema} from "@schemas/idSchema.js";
import {userIdSchema} from "@schemas/userIdSchema.js";

import {getUserMusic} from "@services/getUserMusic.js";
import {modelMap} from "@services/modelMap.js";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {nameOptionalSchema} from "@schemas/nameSchema.js";

export const adminLikeRouter = Router();

adminLikeRouter.get('/all_from_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id: userId} = idSchema.parse(req.params)
    const {page, limit, name} = pageLimitSchema.extend(nameOptionalSchema.shape).parse(req.query)

    const {music, total, skip} = await getUserMusic(userId, page, limit, name, modelMap.like, true)

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

adminLikeRouter.post('/add/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {user_id: userId} = userIdSchema.parse(req.query)

    const isLiked = await like(id, userId)

    res.json({
        isLiked,
    })
}))