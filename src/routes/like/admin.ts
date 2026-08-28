import { type Request, type Response } from 'express';
import {likeRouter} from "@routes/like/index.js";
import {db} from "@/db.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";
import {idSchema} from "@schemas/idSchema.js";
import {getAllUserMusic} from "@services/getAllUserMusicService.js";
import {modelMap} from "@services/modelMap.js";
import {musicException} from "@utils/httpExceptions.js";
import {successResponse} from "@responses/successResponse.js";

likeRouter.get('/all_from_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    await getAllUserMusic(req, res, modelMap.like, id)
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