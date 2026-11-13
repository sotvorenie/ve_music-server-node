import {db} from "@/db.js";

import {createAvatar} from "@composables/useCreateAvatar.js";
import {deletePath} from "@composables/useDeletePath.js";

import {artistException} from "@utils/httpExceptions.js";

export const uploadAvatar = async (
    id: number,
    avatarFile: Express.Multer.File,
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

    const url = await createAvatar(avatarFile, id, 'artist')

    await db.artist.update({
        where: {
            id,
        },
        data: {
            avatarUrl: url,
        },
    })

    try {
        if (artist.avatarUrl) await deletePath(artist.avatarUrl)
    } catch {}

    return url
}