import {type Request, type Response, Router} from "express";

import {
    deletePreviewForTrack,
    deleteVideo, getPosters,
    updateAuditionsForTrack,
    updatePreviewPathForTrack,
    updatePreviewUrlForTrack,
    updateTrack, updateVideoPathForTrack
} from "@routes/music/services/index.js";
import {auditionsCountSchema, pathSchema} from "@routes/music/schemas.js";

import {getHasMore} from "@composables/useGetHasMore.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";

import {deleteTrack} from "@services/deleteTrack.js";

import {idSchema} from "@schemas/idSchema.js";
import {musicInfoSchema} from "@schemas/musicInfoSchema.js";
import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {urlSchema} from "@schemas/urlSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminMusicRouter = Router();

adminMusicRouter.patch('/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const { name, genre_id: genreId, artists } = musicInfoSchema.parse(req.body)

    await updateTrack(id, genreId, name, artists)

    return successResponse(res)
}))

adminMusicRouter.patch('/:id/video/path', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {path} = pathSchema.parse(req.body)

    const url = await updateVideoPathForTrack(id, path)

    res.json({
        url,
    })
}))

adminMusicRouter.patch('/:id/preview/path', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {path} = pathSchema.parse(req.body)

    const url = await updatePreviewPathForTrack(id, path)

    res.json({
        url,
    })
}))

adminMusicRouter.patch('/:id/preview/url', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {url} = urlSchema.parse(req.body)

    await updatePreviewUrlForTrack(id, url)

    return successResponse(res)
}))

adminMusicRouter.patch('/:id/auditions', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { id } = idSchema.parse(req.params)
    const {auditions_count: auditionsCount} = auditionsCountSchema.parse(req.body)

    await updateAuditionsForTrack(id, auditionsCount)

    return successResponse(res)
}))

adminMusicRouter.delete('/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    await deleteTrack(id)

    return successResponse(res)
}))

adminMusicRouter.delete('/:id/preview', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    await deletePreviewForTrack(id)

    return successResponse(res)
}))

adminMusicRouter.delete('/:id/video', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    await deleteVideo(id)

    return successResponse(res)
}))

adminMusicRouter.get('/posters', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {page, limit} = pageLimitSchema.parse(req.query)

    const {posters, skip, total} = await getPosters(page, limit)

    res.json({
        data: posters,
        meta: {
            page,
            limit,
            total,
            hasMore: getHasMore(skip, limit, total),
        },
    })
}))
