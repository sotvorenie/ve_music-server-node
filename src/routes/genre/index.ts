import { Router, type Request, type Response } from 'express';
import {db} from "@/db.js";

import {adminGenreRouter} from "@routes/genre/admin.js";

import {asyncHandler} from "@utils/asyncHandler.js";

import {isAdminSchema} from "@schemas/isAdminSchema.js";

export const genreRouter = Router();
genreRouter.use('/', adminGenreRouter)

genreRouter.get('/all', asyncHandler(async (req: Request, res: Response) => {
    const {is_admin: isAdmin} = isAdminSchema.parse(req.query)

    const genres = await db.genre.findMany({
        select: {
            id: true,
            name: true,
            ...(isAdmin && {
                createdAt: true,
                updatedAt: true,
            })
        }
    })

    res.json({
        genres,
    })
}))