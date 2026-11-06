import type {Request, Response} from "express";
import {db} from "@/db.js";

import {searchSchema} from "@routes/search/schemas.js";
import {successResponse} from "@responses/successResponse.js";
import {idSchema} from "@schemas/idSchema.js";

export const getUserSearchHistory = async (
    res: Response,
    currentUserId: number,
) => {
    const search = await db.search.findMany({
        where: {
            userId: currentUserId,
        },
        select: {
            search: true,
        }
    })

    res.json({
        data: search,
    })
}

export const setToUserSearchHistory = async (
    req: Request,
    res: Response,
    currentUserId: number,
) => {
    const { search } = searchSchema.parse(req.body)

    await db.search.create({
        data: {
            search,
            userId: currentUserId,
        }
    })

    const searchList = await db.search.findMany({
        where: {
            userId: currentUserId,
        },
        orderBy: {
            createdAt: 'asc'
        },
        select: {
            id: true,
        }
    })

    if (searchList?.length > 5 && searchList[0]?.id) {
        const oldestSearchId = searchList[0].id
        await db.search.delete({
            where: {
                id: oldestSearchId,
            }
        })
    }

    return successResponse(res)
}

export const deleteFromUserSearchHistory = async (
    req: Request,
    res: Response,
    currentUserId: number,
) => {
    const { id } = idSchema.parse(req.params)

    await db.search.delete({
        where: {
            id,
            userId: currentUserId,
        }
    })

    return successResponse(res)
}