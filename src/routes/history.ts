import { Router, type Request, type Response } from 'express';

import {asyncHandler} from "../utils/asyncHandler.js";
import {getAdmin, getUser} from "../utils/auth.js";
import {getAllUserMusic} from "../services/getAllUserMusicService.js";
import {modelMap} from "../services/modelMap.js";
import {idSchema} from "../schemas/idSchema.js";
import {deleteFromDB} from "../services/deleteService.js";

export const historyRouter = Router();

historyRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id
    await getAllUserMusic(req, res, modelMap.history, currentUserId)
}))


// --- для админки --- //
historyRouter.get('/all_from_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    await getAllUserMusic(req, res, modelMap.history, id)
}))

historyRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await deleteFromDB(req, res, modelMap.history)
}))