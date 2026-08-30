import { type Request, type Response } from 'express';
import {db} from "@/db.js";
import {historyRouter} from "@routes/history/index.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";

import {idSchema} from "@schemas/idSchema.js";
import {userIdSchema} from "@schemas/userIdSchema.js";

import {getAllUserMusic} from "@services/getAllUserMusicService.js";
import {modelMap} from "@services/modelMap.js";

import {successResponse} from "@responses/successResponse.js";

historyRouter.get('/all_from_user/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    await getAllUserMusic(req, res, modelMap.history, id)
}))

historyRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id: musicId} = idSchema.parse(req.params)
    const {user_id: userId} = userIdSchema.parse(req.query)

    await db.history.delete({
        where: {
            userId_musicId: {
                userId,
                musicId
            }
        }
    })

    successResponse(res)
}))