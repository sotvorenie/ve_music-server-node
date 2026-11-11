import type { Request, Response, NextFunction } from 'express';

import {deletePath} from "@composables/useDeletePath.js";

const collectTempPaths = (req: Request): string[] => {
    const paths: string[] = []

    if (req.file?.path) paths.push(req.file.path)

    const files = req.files
    if (Array.isArray(files)) {
        for (const f of files) if (f?.path) paths.push(f.path)
    } else if (files && typeof files === 'object') {
        for (const arr of Object.values(files)) {
            for (const f of arr ?? []) if (f?.path) paths.push(f.path)
        }
    }

    return paths
}

export const cleanupTempFiles = (req: Request, res: Response, next: NextFunction) => {
    res.on('close', () => {
        const paths = collectTempPaths(req)
        void Promise.allSettled(paths.map(p => deletePath(p)))
    })
    next()
}