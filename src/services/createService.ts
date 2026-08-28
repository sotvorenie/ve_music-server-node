import { type Request, type Response } from 'express';

import {nameSchema} from "@schemas/nameSchema.js";

export const createInDB = async (
    req: Request,
    res: Response,
    model: any,
) => {
    const {name} = nameSchema.parse(req.body)

    const newItem = await model.create({
        data: {
            name,
        },
        select: {
            id: true,
            name: true,
        }
    })

    res.status(201).json(newItem)
}