import { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';

import {dbException} from "@utils/httpExceptions.js";

export const asyncHandler = (fn: Function) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const controller = new AbortController();
        (req as any).signal = controller.signal
        req.checkAborted = () => {
            if ((req as any).signal?.aborted) {
                const err = new Error('Request aborted')
                err.name = 'AbortError'
                throw err
            }
            return false
        }
        req.on('aborted', () => controller.abort())

        if ((req as any).signal?.aborted || (req as any).aborted) return

        try {
            if (req.checkAborted) req.checkAborted()

            await fn(req, res, next)

            if (req.checkAborted) req.checkAborted()
        } catch (err: any) {
            if (err?.name === 'AbortError') return

            console.error("Ошибка в эндпоинте:", err)

            if (err instanceof ZodError) {
                return res.status(400).json({
                    error: "Ошибка валидации данных",
                    details: err.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
                })
            }

            if (err.status && err.detail) {
                return res.status(err.status).json({ detail: err.detail })
            }

            res.status(dbException.status).json({ error: dbException.detail })
        }
    }
}