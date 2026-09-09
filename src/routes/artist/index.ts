import { Router, type Request, type Response } from 'express';
import {db} from "@/db.js";

import {adminArtistRouter} from "@routes/artist/admin.js";

import {getSkip} from "@composables/useGetSkip.js";
import {getHasMore} from "@composables/useGetHasMore.js";

import {asyncHandler} from "@utils/asyncHandler.js";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {nameSchema} from "@schemas/nameSchema.js";
import {isAdminSchema} from "@schemas/isAdminSchema.js";

import {artistAdminSelect, artistFullSelect} from "@selects/artistSelect.js";

export const artistRouter = Router();

artistRouter.get('/list', asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, name, is_admin: isAdmin} = pageLimitSchema.extend(isAdminSchema.shape).extend(nameSchema.shape).parse(req.query)

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
            select: isAdmin ? artistAdminSelect : artistFullSelect,
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

artistRouter.use('/', adminArtistRouter)