import { Router, type Request, type Response } from 'express';
import {db} from "../db.js";

import {asyncHandler} from "../utils/asyncHandler.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {getSkip} from "../composables/useGetSkip.js";
import {getHasMore} from "../composables/useGetHasMore.js";
import {artistFullSelect} from "../selects/artistSelect.js";
import {nameSchema} from "../schemas/nameSchema.js";
import {getAdmin} from "../utils/auth.js";

export const artistRouter = Router();

artistRouter.get('/all', asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = pageLimitSchema.parse(req.query)

    const skip = getSkip(page, limit)

    const [artists, total] = await Promise.all([
        db.artist.findMany({
            select: artistFullSelect,
            skip,
            take: limit,
        }),
        db.artist.count()
    ])

    res.json({
        artists,
        page,
        limit,
        total,
        hasMore: getHasMore(skip, limit, total),
    })
}))

const searchArtistsQuerySchema = pageLimitSchema.extend(nameSchema.shape)
artistRouter.get('/search', asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, name } = searchArtistsQuerySchema.parse(req.query)

    const skip = getSkip(page, limit)

    const where = {
        name: {
            contains: name,
            mode: 'insensitive' as const
        }
    }

    const [artists, total] = await Promise.all([
        db.artist.findMany({
            where,
            select: artistFullSelect,
            skip,
            take: limit,
        }),
        db.artist.count({where})
    ])

    res.json({
        artists,
        page,
        limit,
        total,
        hasMore: getHasMore(skip, limit, total),
    })
}))


// --- для админки --- //
artistRouter.post('/create', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {name} = nameSchema.parse(req.body)

    const newArtist = await db.artist.create({
        data: {
            name,
        },
        select: {
            id: true,
            name: true,
        }
    })

    res.status(201).json(newArtist)
}))
