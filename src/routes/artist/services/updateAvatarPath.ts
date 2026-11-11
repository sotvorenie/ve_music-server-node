import {db} from "@/db.js";

import {createUrl} from "@composables/useCreateUrl.js";

export const updateAvatarPath = async (
    id: number,
    path: string,
) => {
    const url = createUrl(path)

   return db.artist.update({
        where: {
            id,
        },
        data: {
            avatarUrl: url,
        },
        select: {
            avatarUrl: true,
        }
    })
}