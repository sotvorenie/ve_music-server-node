import { Router, type Request, type Response } from 'express';

import {adminSearchRouter} from "@routes/search/admin.js";
import {
    deleteFromUserSearchHistory,
    getUserSearchHistory,
    setToUserSearchHistory
} from "@routes/search/services/helpers.js";
import {searchSchema, typeSchema} from "@routes/search/schemas.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";

import {idSchema} from "@schemas/idSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const searchRouter = Router();

searchRouter.get('/', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    const search = await getUserSearchHistory(currentUserId)

    res.json({
        data: search,
    })
}))

searchRouter.post('/', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { search, type } = searchSchema.extend(typeSchema.shape).parse(req.body)
    const currentUserId = req.user!.id

    const newSearch = await setToUserSearchHistory(currentUserId, search, type)

    res.json(newSearch)
}))

searchRouter.delete('/:id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { id } = idSchema.parse(req.params)
    const currentUserId = req.user!.id

    await deleteFromUserSearchHistory(id, currentUserId)

    successResponse(res)
}))

searchRouter.use('/admin', adminSearchRouter)