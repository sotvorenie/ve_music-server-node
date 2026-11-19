import {db} from "@/db.js";

export const uploadVideo = async (
    id: number,
    file: Express.Multer.File,
) => {
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