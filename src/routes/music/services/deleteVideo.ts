import {db} from "@/db.js";

import {deletePath} from "@composables/useDeletePath.js";

export const deleteVideo = async (
    id: number,
) => {
    const music = await db.music.findUnique({
        where: {
            id,
        },
        select: {
            videoClipUrl: true,
        },
    })

    await Promise.all([
        db.music.update({
            where: {
                id,
            },
            data: {
                videoClipUrl: null,
            },
        }),
        deletePath(music?.videoClipUrl)
    ])
}