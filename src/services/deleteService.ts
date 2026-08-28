import { type Request, type Response } from 'express';

import {idSchema} from "@schemas/idSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const deleteFromDB = async (
    req: Request,
    res: Response,
    model: any,
) => {
    const {id} = idSchema.parse(req.params)

    await model.delete({
        where: {
            id
        }
    })

    successResponse(res)
}