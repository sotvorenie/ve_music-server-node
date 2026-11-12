import {type Request, type Response, Router} from "express";

import {
    deletePreviewForTrack,
    deleteTrack, deleteVideo, getPosters,
    updateAuditionsForTrack,
    updatePreviewPathForTrack,
    updatePreviewUrlForTrack,
    updateTrack
} from "@routes/music/services/index.js";
import {auditionsCountSchema, urlSchema} from "@routes/music/schemas.js";

import {getHasMore} from "@composables/useGetHasMore.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";

import {idSchema} from "@schemas/idSchema.js";
import {musicInfoSchema} from "@schemas/musicInfoSchema.js";
import {pathSchema} from "@schemas/pathSchema.js";
import {pageLimitSchema} from "@schemas/pageLimitSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminMusicRouter = Router();

adminMusicRouter.patch('/update/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const { name, genre_id: genreId, artists } = musicInfoSchema.parse(req.body)

    await updateTrack(id, genreId, name, artists)

    successResponse(res)
}))

adminMusicRouter.patch('/update_preview_path/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {path} = pathSchema.parse(req.body)

    const url = await updatePreviewPathForTrack(id, path)

    res.json({
        url,
    })
}))

adminMusicRouter.patch('/update_preview_url/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {url} = urlSchema.parse(req.body)

    await updatePreviewUrlForTrack(id, url)

    successResponse(res)
}))

adminMusicRouter.patch('/update_auditions/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { id } = idSchema.parse(req.params)
    const {auditions_count: auditionsCount} = auditionsCountSchema.parse(req.body)

    await updateAuditionsForTrack(id, auditionsCount)

    successResponse(res)
}))

adminMusicRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    await deleteTrack(id)

    successResponse(res)
}))

adminMusicRouter.patch('/delete_preview/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    await deletePreviewForTrack(id)

    successResponse(res)
}))

adminMusicRouter.patch('/delete_video/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    await deleteVideo(id)

    successResponse(res)
}))

adminMusicRouter.get('/get_posters', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
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
