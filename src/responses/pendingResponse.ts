import { type Response } from 'express';

export const pendingResponse = (
    res: Response,
) => {
    return res.status(202).send()
}