import { type Request, type Response } from 'express';

import {getSkip} from "@composables/useGetSkip.js";
import {getHasMore} from "@composables/useGetHasMore.js";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {nameSchema} from "@schemas/nameSchema.js";

import {musicBaseWithArtistsSelect} from "@selects/musicSelect.js";

export const getAllUserMusic = async (
    req: Request,
    res: Response,
    model: any,
    currentUserId: number,
    isHistory: boolean = false,
) => {
    const {page, limit, name} = pageLimitSchema.extend(nameSchema.shape).parse(req.query)

    const skip = getSkip(page, limit)

    const where = {
        userId: currentUserId,
        ...(name?.length && {
            music : {
                name: {
                    contains: name,
                    mode: 'insensitive' as const
                }
            }
        })
    }

    const [music, total] = await Promise.all([
        model.findMany({
            where,
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
        model.count({where})
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