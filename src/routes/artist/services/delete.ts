import {db} from "@/db.js";

import {deletePath} from "@composables/useDeletePath.js";

export const deleteArtist = async (
    id: number,
) => {
    const artist = await db.artist.delete({
        where: {
            id,
        },
        select: {
            avatarUrl: true,
        },
    })

    try {
        if (artist.avatarUrl) await deletePath(artist.avatarUrl)
    } catch {}
}