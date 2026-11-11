import {db} from "@/db.js";

import {getSkip} from "@composables/useGetSkip.js";

import {artistAdminSelect, artistFullSelect} from "@selects/artistSelect.js";

export const getArtists = async (
    page: number,
    limit: number,
    name: string | undefined,
    isAdmin: boolean = false,
) => {
    const skip = getSkip(page, limit)

    const where = {
        ...(name && {
            name: {
                contains: name,
                mode: 'insensitive' as const
            }
        }),
    }

    const [artists, total] = await Promise.all([
        db.artist.findMany({
            where,
            select: isAdmin ? artistAdminSelect : artistFullSelect,
            skip,
            take: limit,
        }),
        db.artist.count({where})
    ])

    return {
        artists,
        total,
        skip,
    }
}