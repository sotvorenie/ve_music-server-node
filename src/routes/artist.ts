import { Router, type Request, type Response } from 'express';
import {z} from "zod";
import {db} from "../db.js";

import {asyncHandler} from "../utils/asyncHandler.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {getSkip} from "../composables/useGetSkip.js";

export const artistRouter = Router();

artistRouter.get('/all', asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = pageLimitSchema.parse(req.query)

    const skip = getSkip(page, limit)

    const [artists, total] = await Promise.all([
        db.artist.findMany({
            select: {
                id: true,
                name: true,
                avatarUrl: true,
            },
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
        hasMore: (skip + limit) < total,
    })
}))

const searchArtistsQuerySchema = pageLimitSchema.extend({
    name: z.string(),
})
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
            select: {
                id: true,
                name: true,
                avatarUrl: true,
            },
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
        hasMore: (skip + limit) < total,
    })
}))
