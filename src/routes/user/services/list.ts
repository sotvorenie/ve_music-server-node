import {db} from "@/db.js";

import {getSkip} from "@composables/useGetSkip.js";

export const getUsers = async (
    name: string | undefined,
    page: number = 1,
    limit: number = 30,
) => {
    const skip = getSkip(page, limit)

    const where = {
        ...(name && {
            name: {
                contains: name,
                mode: 'insensitive' as const
            }
        })
    }

    let [users, total] = await Promise.all([
        db.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                login: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
            },
            skip,
            take: limit,
        }),
        db.user.count({where})
    ])

    return {
        users,
        total,
        skip,
    }
}