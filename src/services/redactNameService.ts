import { type Request, type Response } from 'express';

import {idSchema} from "../schemas/idSchema.js";
import {nameSchema} from "../schemas/nameSchema.js";
import {successResponse} from "../responses/successResponse.js";

export const redactNameInDB = async (
    req: Request,
    res: Response,
    model: any,
) => {
    const {id} = idSchema.parse(req.params)
    const {name} = nameSchema.parse(req.body)

    await model.update({
        where: {
            id
        },
        data: {
            name,
        }
    })

    successResponse(res)
}