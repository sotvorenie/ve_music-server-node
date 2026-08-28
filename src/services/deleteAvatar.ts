import { type Request, type Response } from 'express';
import path from "node:path";
import fs from "node:fs/promises";

import {BASE_STORAGE_DIR} from "@/config.js";

import {idSchema} from "@schemas/idSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const deleteAvatar = async (
    req: Request,
    res: Response,
    model: any,
    emptyException: any
) => {
    const {id} = idSchema.parse(req.params)

    const item = model.findUnique({
        where: {
            id
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

    const avatarUrl = item.avatarUrl.replace('/static/', '')
    const avatarPath = path.join(BASE_STORAGE_DIR, avatarUrl)

    try {
        req.checkAborted()
        await fs.unlink(avatarPath)
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            console.log('Старый файл аватарки не найден, пропускаем удаление')
        } else {
            console.error('Ошибка при удалении аватарки:', err)
        }
    }

    successResponse(res)
}