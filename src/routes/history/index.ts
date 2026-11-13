import { Router, type Request, type Response } from 'express';

import {adminHistoryRouter} from "@routes/history/admin.js";

import {getHasMore} from "@composables/useGetHasMore.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";

import {getUserMusic} from "@services/getUserMusic.js";
import {modelMap} from "@services/modelMap.js";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {nameOptionalSchema} from "@schemas/nameSchema.js";

export const historyRouter = Router();

historyRouter.get('/', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, name} = pageLimitSchema.extend(nameOptionalSchema.shape).parse(req.query)
    const currentUserId = req.user!.id

    const {music, total, skip} = await getUserMusic(currentUserId, page, limit, name, modelMap.history)

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

historyRouter.use('/admin', adminHistoryRouter)