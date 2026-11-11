import {db} from "@/db.js";

import {createUrl} from "@composables/useCreateUrl.js";

export const updatePreviewPathForTrack = async (
    id: number,
    path: string,
) => {
    const data = await db.music.update({
        where: {
            id
        },
        data: {
            previewUrl: createUrl(path)
        },
        select: {
            previewUrl: true,
        }
    })

    return data.previewUrl
}