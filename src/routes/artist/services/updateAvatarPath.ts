import {db} from "@/db.js";

import {createUrl} from "@composables/useCreateUrl.js";
import {deletePath} from "@composables/useDeletePath.js";

import {artistException} from "@utils/httpExceptions.js";

export const updateAvatarPath = async (
    id: number,
    path: string,
) => {
    const artist = await db.artist.findUnique({
        where: {
            id,
        },
        select: {
            avatarUrl: true,
        },
    })
    if (!artist) throw artistException

    try {
        if (artist.avatarUrl) await deletePath(artist.avatarUrl)
    } catch {}

   return db.artist.update({
        where: {
            id,
        },
        data: {
            avatarUrl: createUrl(path),
        },
        select: {
            avatarUrl: true,
        }
    })
}