import { type Request, type Response } from 'express';

import {getSkip} from "@composables/useGetSkip.js";
import {getHasMore} from "@composables/useGetHasMore.js";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";

import {musicBaseWithArtistsSelect} from "@selects/musicSelect.js";

export const getAllUserMusic = async (
    req: Request,
    res: Response,
    model: any,
    currentUserId: number,
    isHistory: boolean = false,
) => {
    const {page, limit} = pageLimitSchema.parse(req.query)

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
            orderBy: {
                date: isHistory ? 'desc' : 'asc'
            }
        }),
        model.count({
            where: {
                userId: currentUserId
            }
        })
    ])

    const formattedMusic = music.map((m: any) => ({
        ...m.music
    }))

    res.json({
        music: formattedMusic,
        page,
        limit,
        total,
        hasMore: getHasMore(skip, limit, total),
    })
}