import { type Request, type Response } from 'express';

import {getSkip} from "../composables/useGetSkip.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {idSchema} from "../schemas/idSchema.js";

export const getAllMusic = async (
    req: Request,
    res: Response,
    model: any,
) => {
    const {id, page, limit} = idSchema.extend(pageLimitSchema.shape).parse(req.params)

    const skip = getSkip(page, limit)

    const music = await model.findMany({
        where: {
            artists: {
                some: {
                    id
                }
            }
        },
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