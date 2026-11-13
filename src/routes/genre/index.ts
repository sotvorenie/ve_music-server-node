import { Router, type Request, type Response } from 'express';

import {adminGenreRouter} from "@routes/genre/admin.js";
import {getGenres} from "@routes/genre/services/index.js";

import {asyncHandler} from "@utils/asyncHandler.js";

import {isAdminSchema} from "@schemas/isAdminSchema.js";

export const genreRouter = Router();

genreRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
    const {is_admin: isAdmin} = isAdminSchema.parse(req.query)

    const genres = await getGenres(isAdmin)

    res.json({
        data: genres,
    })
}))

genreRouter.use('/admin', adminGenreRouter)