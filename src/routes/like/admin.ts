import { type Request, type Response } from 'express';
import {db} from "@/db.js";
import {likeRouter} from "@routes/like/index.js";

import {likeService} from "@routes/like/services.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";

import {idSchema} from "@schemas/idSchema.js";
import {userIdSchema} from "@schemas/userIdSchema.js";

import {successResponse} from "@responses/successResponse.js";

import {getAllUserMusic} from "@services/getAllUserMusicService.js";
import {modelMap} from "@services/modelMap.js";

likeRouter.get('/all_from_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    await getAllUserMusic(req, res, modelMap.like, id)
}))

likeRouter.post('/add/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {user_id: userId} = userIdSchema.parse(req.query)

    await likeService(req, res, userId, true)
}))

likeRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id: musicId} = idSchema.parse(req.params)
    const {user_id: userId} = userIdSchema.parse(req.query)

    await db.$transaction(async (tx) => {
        await tx.like.delete({
            where: {
                userId_musicId: {
                    userId,
                    musicId
                }
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