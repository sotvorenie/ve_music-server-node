import { type Response } from 'express';

export const createdResponse = (
    res: Response,
) => {
    return res.status(201).send()
}