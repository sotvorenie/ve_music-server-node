import { Router, type Request, type Response } from 'express';
import {db} from "@/db.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getAllMusic} from "@services/getMusicService.js";
import {modelMap} from "@services/modelMap.js";
import {getSkip} from "@composables/useGetSkip.js";
import {artistFullSelect} from "@selects/artistSelect.js";
import {getHasMore} from "@composables/useGetHasMore.js";
import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {nameSchema} from "@schemas/nameSchema.js";

export const artistRouter = Router();

artistRouter.get('/all', asyncHandler(async (req: Request, res: Response) => {
    await getAllMusic(req, res, modelMap.artist)
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