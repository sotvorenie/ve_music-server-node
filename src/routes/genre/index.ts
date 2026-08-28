import { Router, type Request, type Response } from 'express';
import {db} from "@/db.js";

import {asyncHandler} from "@utils/asyncHandler.js";

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