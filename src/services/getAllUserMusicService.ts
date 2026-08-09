import { type Request, type Response } from 'express';

import {getSkip} from "../composables/useGetSkip.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {musicBaseWithArtistsSelect} from "../selects/musicSelect.js";
import {getHasMore} from "../composables/useGetHasMore.js";

export const getAllUserMusic = async (
    req: Request,
    res: Response,
    model: any,
) => {
    const {page, limit} = pageLimitSchema.parse(req.query)
    const currentUserId = req.user!.id

    const skip = getSkip(page, limit)

    const [music, total] = await Promise.all([
        model.findMany({
            where: {
                userId: currentUserId
            },
            select: {
                music: {
                    select: musicBaseWithArtistsSelect
                }
            },
            skip,
            take: limit,
        }),
        model.count({
            where: {
                userId: currentUserId
            }
        })
    ])

    res.json({
        music,
        page,
        limit,
        total,
        hasMore: getHasMore(skip, limit, total),
    })
}