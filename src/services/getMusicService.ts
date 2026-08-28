import { type Request, type Response } from 'express';
import {db} from "@/db.js";

import {getSkip} from "@composables/useGetSkip.js";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {idSchema} from "@schemas/idSchema.js";

import {modelMap} from "@services/modelMap.js";

export const getAllMusic = async (
    req: Request,
    res: Response,
    model: any,
) => {
    const {id, page, limit} = idSchema.extend(pageLimitSchema.shape).parse(req.params)

    const skip = getSkip(page, limit)

    let where
    if (model === modelMap.artist) {
        where = {
            artists: {
                some: {
                    id
                }
            }
        }
    }
    if (model === modelMap.genre) {
        where = {
            genreId: id
        }
    }
    if (!where) return

    const music = await db.music.findMany({
        where,
        select: {
            id: true,
            name: true,
        },
        skip,
        take: limit,
    })

    res.json({
        music,
        page,
        limit,
    })
}