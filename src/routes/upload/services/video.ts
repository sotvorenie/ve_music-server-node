import {db} from "@/db.js";

export const uploadVideo = async (
    id: number,
    file: Express.Multer.File,
) => {
    return db.music.update({
        where: {
            id,
        },
        data: {
            urlWithClip: file.path,
            status: 'PENDING',
        },
    })
}