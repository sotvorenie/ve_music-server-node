import { type Request, type Response } from 'express';

import {deleteFile} from "@composables/useDeleteFile.js";

import {idSchema} from "@schemas/idSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const deleteAvatar = async (
    req: Request,
    res: Response,
    model: any,
    emptyException: any,
    isUser: boolean = false
) => {
    const id = isUser ? req.user!.id : idSchema.parse(req.params)?.id

    const item = await model.findUnique({
        where: {
            id
        },
        select: {
            avatarUrl: true
        }
    })
    if (!item?.avatarUrl) throw emptyException

    await model.update({
        where: {
            id
        },
        data: {
            avatarUrl: '',
        }
    })

    req.checkAborted()

    await deleteFile(item.avatarUrl)

    successResponse(res)
}