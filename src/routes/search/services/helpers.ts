import {db} from "@/db.js";
import type {SearchType} from "@/generated/prisma/enums.js";

export const getUserSearchHistory = async (
    currentUserId: number,
) => {
   return db.search.findMany({
        where: {
            userId: currentUserId,
        },
        select: {
            id: true,
            search: true,
            type: true,
        },
    })
}

export const setToUserSearchHistory = async (
    currentUserId: number,
    search: string,
    type: SearchType,
) => {
    const newSearch = await db.search.create({
        data: {
            search,
            userId: currentUserId,
            type,
        },
        select: {
            id: true,
            search: true,
            type: true,
        },
    })

    const searchList = await db.search.findMany({
        where: {
            userId: currentUserId,
            type,
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

    return newSearch
}

export const deleteFromUserSearchHistory = async (
    id: number,
    currentUserId: number,
) => {
    return db.search.delete({
        where: {
            id,
            userId: currentUserId,
        }
    })
}