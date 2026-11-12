import {db} from "@/db.js";

export const uploadVideo = async (
    id: number,
    file: Express.Multer.File,
) => {
    await Promise.all([
        db.music.update({
            where: {
                id,
            },
            data: {
                urlWithClip: file.path,
                status: 'PENDING',
            },
        }),
        db.$executeRaw`NOTIFY music_pending;`
    ])
}