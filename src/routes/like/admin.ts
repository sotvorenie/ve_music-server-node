import { type Request, type Response } from 'express';
import {db} from "@/db.js";
import {likeRouter} from "@routes/like/index.js";

import {likeService} from "@routes/like/services.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";
import {musicException} from "@utils/httpExceptions.js";

import {idSchema} from "@schemas/idSchema.js";

import {successResponse} from "@responses/successResponse.js";

import {getAllUserMusic} from "@services/getAllUserMusicService.js";
import {modelMap} from "@services/modelMap.js";

likeRouter.get('/all_from_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    await getAllUserMusic(req, res, modelMap.like, id)
}))

likeRouter.post('/add/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id: userId} = idSchema.parse(req.query)

    await likeService(req, res, userId, true)
}))

likeRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const music = await db.like.findUnique({
        where: {
            id
        },
        select: {
            musicId: true
        }
    })
    const musicId = music?.musicId
    if (!musicId) throw musicException

    await db.$transaction(async (tx) => {
        await tx.like.delete({
            where: {
                id
            }
        })
        await tx.music.update({
            where: {
                id: musicId
            },
            data: {
                likesCount: {decrement: 1}
            }
        })
    })

    successResponse(res)
}))