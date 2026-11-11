import { Router, type Request, type Response } from 'express';

import {adminArtistRouter} from "@routes/artist/admin.js";
import {getArtists} from "@routes/artist/services/index.js";

import {getHasMore} from "@composables/useGetHasMore.js";

import {asyncHandler} from "@utils/asyncHandler.js";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {nameOptionalSchema} from "@schemas/nameSchema.js";
import {isAdminSchema} from "@schemas/isAdminSchema.js";

export const artistRouter = Router();

artistRouter.get('/list', asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, name, is_admin: isAdmin} = pageLimitSchema.extend(isAdminSchema.shape).extend(nameOptionalSchema.shape).parse(req.query)

    const {artists, total, skip} = await getArtists(page, limit, name, isAdmin)

    res.json({
        data: artists,
        meta: {
            page,
            limit,
            total,
            hasMore: getHasMore(skip, limit, total),
        },
    })
}))

artistRouter.use('/admin', adminArtistRouter)