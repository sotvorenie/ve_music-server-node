import {db} from "@/db.js";

import {createUrl} from "@composables/useCreateUrl.js";

export const updateVideoPathForTrack = async (
    id: number,
    path: string,
) => {
    const data = await db.music.update({
        where: {
            id,
        },
        data: {
            videoClipUrl: createUrl(path),
        },
        select: {
            videoClipUrl: true,
        },
    })

    return data.videoClipUrl
}