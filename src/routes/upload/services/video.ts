import {db} from "@/db.js";

import {deletePath} from "@composables/useDeletePath.js";

export const uploadVideo = async (
    id: number,
    file: Express.Multer.File,
) => {
    const music = await db.music.findUnique({
        where: {
            id,
        },
        select: {
            videoClipUrl: true,
        },
    })

    if (music?.videoClipUrl) await deletePath(music.videoClipUrl)

    await db.music.update({
        where: {
            id,
        },
        data: {
            videoClipUrl: file.path,
            status: 'PENDING',
        },
    })

    await db.$executeRaw`NOTIFY music_pending;`
}