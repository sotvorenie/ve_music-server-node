import { type Request, type Response } from 'express';
import {historyRouter} from "@routes/history/index.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";

import {idSchema} from "@schemas/idSchema.js";

import {getAllUserMusic} from "@services/getAllUserMusicService.js";
import {modelMap} from "@services/modelMap.js";
import {deleteFromDB} from "@services/deleteService.js";

historyRouter.get('/all_from_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    await getAllUserMusic(req, res, modelMap.history, id)
}))

historyRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await deleteFromDB(req, res, modelMap.history)
}))