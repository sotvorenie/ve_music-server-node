import {type Request, type Response, Router} from 'express';

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";

import {getAllMusic} from "@services/getMusicService.js";
import {modelMap} from "@services/modelMap.js";
import {createInDB} from "@services/createService.js";
import {deleteFromDB} from "@services/deleteService.js";
import {redactNameInDB} from "@services/redactNameService.js";

export const adminGenreRouter = Router();

adminGenreRouter.get('/music/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await getAllMusic(req, res, modelMap.genre)
}))

adminGenreRouter.post('/create', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await createInDB(req, res, modelMap.genre)
}))

adminGenreRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await deleteFromDB(req, res, modelMap.genre)
}))

adminGenreRouter.patch('/redact_name/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await redactNameInDB(req, res, modelMap.genre)
}))