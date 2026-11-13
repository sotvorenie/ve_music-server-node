import { type Request, type Response, Router } from 'express';

import {deleteHistory} from "@routes/history/services/index.js";

import {getHasMore} from "@composables/useGetHasMore.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";

import {idSchema} from "@schemas/idSchema.js";
import {userIdSchema} from "@schemas/userIdSchema.js";

import {getUserMusic} from "@services/getUserMusic.js";
import {modelMap} from "@services/modelMap.js";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {nameOptionalSchema} from "@schemas/nameSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminHistoryRouter = Router();

adminHistoryRouter.get('/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {page, limit, name} = pageLimitSchema.extend(nameOptionalSchema.shape).parse(req.query)

    const {music, total, skip} = await getUserMusic(id, page, limit, name, modelMap.history, true)

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

adminHistoryRouter.delete('/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id: musicId} = idSchema.parse(req.params)
    const {user_id: userId} = userIdSchema.parse(req.query)

    await deleteHistory(userId, musicId)

    successResponse(res)
}))