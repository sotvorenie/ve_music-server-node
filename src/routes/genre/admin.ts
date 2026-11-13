import {type Request, type Response, Router} from 'express';

import {createGenre, getGenre} from "@routes/genre/services/index.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";

import {getMusic} from "@services/getMusic.js";
import {modelMap} from "@services/modelMap.js";
import {deleteFromDB} from "@services/deleteFromDB.js";
import {updateNameInDB} from "@services/updateNameInDB.js";

import {idSchema} from "@schemas/idSchema.js";
import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {nameSchema} from "@schemas/nameSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminGenreRouter = Router();

adminGenreRouter.get('/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const genre = await getGenre(id)

    res.json(genre)
}))

adminGenreRouter.get('/:id/music', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {page, limit} = pageLimitSchema.parse(req.params)

    const music = await getMusic(id, page, limit, modelMap.genre)

    res.json({
        data: music,
        meta: {
            page,
            limit,
        },
    })
}))

adminGenreRouter.post('/', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {name} = nameSchema.parse(req.body)

    const newItem = await createGenre(name, modelMap.genre)

    res.status(201).json(newItem)
}))

adminGenreRouter.delete('/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    await deleteFromDB(id, modelMap.genre)

    successResponse(res)
}))

adminGenreRouter.patch('/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {name} = nameSchema.parse(req.body)

    await updateNameInDB(id, name, modelMap.genre)

    successResponse(res)
}))