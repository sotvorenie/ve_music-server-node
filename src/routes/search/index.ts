import { Router, type Request, type Response } from 'express';

import {adminSearchRouter} from "@routes/search/admin.js";
import {deleteFromUserSearchHistory, getUserSearchHistory, setToUserSearchHistory} from "@routes/search/services.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";

export const searchRouter = Router();

searchRouter.get('/list', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id
    await getUserSearchHistory(res, currentUserId)
}))

searchRouter.post('/set', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id
    await setToUserSearchHistory(req, res, currentUserId)
}))

searchRouter.delete('/delete/:id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id
    await deleteFromUserSearchHistory(req, res, currentUserId)
}))

searchRouter.use('/admin', adminSearchRouter)