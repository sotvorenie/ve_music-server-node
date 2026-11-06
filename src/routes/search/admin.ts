import { type Request, type Response, Router } from 'express';

import {deleteFromUserSearchHistory, getUserSearchHistory, setToUserSearchHistory} from "@routes/search/services.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";

import {idSchema} from "@schemas/idSchema.js";
import {userIdSchema} from "@schemas/userIdSchema.js";

export const adminSearchRouter = Router();

adminSearchRouter.get('/all_from_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    await getUserSearchHistory(res, id)
}))

adminSearchRouter.post('/set_for_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    await setToUserSearchHistory(req, res, id)
}))

adminSearchRouter.delete('/delete_from_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.query)
    await deleteFromUserSearchHistory(req, res, userId)
}))