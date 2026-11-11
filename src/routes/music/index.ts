import { Router, type Request, type Response } from 'express';

import {adminMusicRouter} from "@routes/music/admin.js";
import {getRandomMusicSchema, musicSchemaGenreIdAndArtistIdAndName, setViewSchema} from "@routes/music/schemas.js";
import {getRandomIds, getTrack, getTracks} from "@routes/music/services/index.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {idSchema} from "@schemas/idSchema.js";
import {isAdminSchema} from "@schemas/isAdminSchema.js";

export const musicRouter = Router();

musicRouter.get('/list', asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, name, genre_id: genreId, artist_id: artistId, is_admin: isAdmin} =
        musicSchemaGenreIdAndArtistIdAndName.extend(pageLimitSchema.shape).extend(isAdminSchema.shape).parse(req.query)

    const {music, total, skip} = await getTracks(
        genreId,
        artistId,
        page,
        limit,
        name,
        isAdmin,
    )

    res.json({
        data: music,
        meta: {
            page,
            limit,
            total,
            hasMore: (skip + limit) < total,
        },
    })
}))

musicRouter.get('/random_list', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const {
        name,
        seed,
        genre_id: genreId,
        artist_id: artistId,
        exclude_id: excludeId,
        page,
        limit,
    } = getRandomMusicSchema.parse(req.query)

    const {ids, hasMore} = await getRandomIds(
        genreId,
        artistId,
        excludeId,
        seed,
        name,
        page,
        limit,
    )

    res.json({
        data: ids,
        meta: {
            page,
            limit,
            hasMore,
        },
    })
}))

musicRouter.get('/:id', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {is_admin: isAdmin, set_view: setView} = isAdminSchema.extend(setViewSchema.shape).parse(req.query)
    const currentUserId = req.user?.id

    const music = await getTrack(id, isAdmin, currentUserId, setView)

    res.json(music)
}))

musicRouter.use('/admin', adminMusicRouter)