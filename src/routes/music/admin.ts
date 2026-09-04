import {type Request, type Response, Router} from "express";
import {z} from "zod";
import {db} from "@/db.js";

import {
    musicServiceCleanUrl,
    musicServiceDeleteFile,
    musicServiceDeleteFromDBAndFile,
    musicServiceUpdateUrl
} from "@routes/music/services.js";
import {musicConstantUpdateTypes} from "@routes/music/constants.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";
import {musicException} from "@utils/httpExceptions.js";

import {idSchema} from "@schemas/idSchema.js";
import {musicInfoSchema} from "@schemas/musicInfoSchema.js";
import {urlSchema} from "@schemas/urlSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminMusicRouter = Router();

adminMusicRouter.patch('/redact/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const { title, genre_id: genreId, artists } = musicInfoSchema.parse(req.body)

    await db.music.update({
        where: {
            id
        },
        data: {
            name: title,
            genreId,
            artists: {
                set: artists.map(artistId => ({ id: artistId }))
            },
        }
    })

    successResponse(res)
}))

adminMusicRouter.patch('/redact_audio_url/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { url } = urlSchema.parse(req.body)
    await musicServiceUpdateUrl(req, res, musicConstantUpdateTypes.audio(url))
}))

adminMusicRouter.patch('/redact_preview_url/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { url } = urlSchema.parse(req.body)
    await musicServiceUpdateUrl(req, res, musicConstantUpdateTypes.preview(url))
}))

adminMusicRouter.patch('/redact_video_url/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { url } = urlSchema.parse(req.body)
    await musicServiceUpdateUrl(req, res, musicConstantUpdateTypes.video(url))
}))

const auditionsCountSchema = z.object({
    auditions_count: z.string().transform(Number),
})
adminMusicRouter.patch('/redact_auditions/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { id } = idSchema.parse(req.params)
    const {auditions_count: auditionsCount} = auditionsCountSchema.parse(req.body)

    await db.music.update({
        where: {
            id
        },
        data: {
            auditionsCount,
        }
    })

    successResponse(res)
}))

adminMusicRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const music = await db.music.findUnique({
        where: {
            id
        }
    })
    if (!music) throw musicException

    await db.music.delete({
        where: {
            id
        }
    })

    req.checkAborted()

    await Promise.all([
        musicServiceDeleteFile(musicServiceCleanUrl(music.url)),
        musicServiceDeleteFile(musicServiceCleanUrl(music.previewUrl)),
        musicServiceDeleteFile(musicServiceCleanUrl(music.videoClipUrl)),
    ])

    successResponse(res)
}))

adminMusicRouter.patch('/delete_preview/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const data = {
        previewUrl: '',
    }
    await musicServiceDeleteFromDBAndFile(req, res, data)
}))

adminMusicRouter.patch('/delete_video/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const data = {
        videoClipUrl: '',
    }
    await musicServiceDeleteFromDBAndFile(req, res, data)
}))