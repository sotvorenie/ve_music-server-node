import { Router, type Request, type Response } from 'express';
import {db} from "../db.js";

import {asyncHandler} from "../utils/asyncHandler.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {getSkip} from "../composables/useGetSkip.js";
import {getUser} from "../utils/auth.js";

export const historyRouter = Router();

historyRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const {page, limit} = pageLimitSchema.parse(req.query)
    const currentUserId = req.user!.id

    const skip = getSkip(page, limit)

    const [music, total] = await Promise.all([
        db.history.findMany({
            where: {
                userId: currentUserId
            },
            select: {
                music: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        artists: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            },
            skip,
            take: limit,
        }),
        db.history.count({
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
        hasMore: (skip + limit) < total,
    })
}))
