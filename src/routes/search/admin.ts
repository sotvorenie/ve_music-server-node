import { type Request, type Response, Router } from 'express';

import {
    deleteFromUserSearchHistory,
    getUserSearchHistory,
    setToUserSearchHistory
} from "@routes/search/services/helpers.js";
import {searchSchema, typeSchema} from "@routes/search/schemas.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";

import {idSchema} from "@schemas/idSchema.js";
import {userIdSchema} from "@schemas/userIdSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminSearchRouter = Router();

adminSearchRouter.get('/all_from_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id: userId} = idSchema.parse(req.params)

    const search = await getUserSearchHistory(userId)

    res.json({
        data: search,
    })
}))

adminSearchRouter.post('/set_for_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { search, type } = searchSchema.extend(typeSchema.shape).parse(req.body)
    const {id: userId} = idSchema.parse(req.params)

    const newSearch = await setToUserSearchHistory(userId, search, type)

    res.json(newSearch)
}))

adminSearchRouter.delete('/delete_from_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { id } = idSchema.parse(req.params)
    const { user_id: userId } = userIdSchema.parse(req.query)

    await deleteFromUserSearchHistory(id, userId)

    return successResponse(res)
}))