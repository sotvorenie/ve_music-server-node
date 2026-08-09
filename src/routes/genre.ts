import { Router, type Request, type Response } from 'express';
import {db} from "../db.js";

import {asyncHandler} from "../utils/asyncHandler.js";
import {getAdmin} from "../utils/auth.js";
import {getAllMusic} from "../services/getMusicService.js";
import {createInDB} from "../services/createService.js";
import {deleteFromDB} from "../services/deleteService.js";
import {modelMap} from "../services/modelMap.js";
import {redactNameInDB} from "../services/redactNameService.js";

export const genreRouter = Router();

genreRouter.get('/all', asyncHandler(async (_: Request, res: Response) => {
    const genres = await db.genre.findMany({
        select: {
            id: true,
            name: true,
        }
    })

    res.json({
        genres,
    })
}))


// --- для админки --- //
genreRouter.get('/music/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await getAllMusic(req, res, modelMap.genre)
}))

genreRouter.post('/create', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await createInDB(req, res, modelMap.genre)
}))

genreRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await deleteFromDB(req, res, modelMap.genre)
}))

genreRouter.patch('/redact_name/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await redactNameInDB(req, res, modelMap.genre)
}))