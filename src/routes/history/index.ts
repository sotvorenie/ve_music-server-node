import { Router, type Request, type Response } from 'express';

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";

import {getAllUserMusic} from "@services/getAllUserMusicService.js";
import {modelMap} from "@services/modelMap.js";

export const historyRouter = Router();

historyRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id
    await getAllUserMusic(req, res, modelMap.history, currentUserId)
}))