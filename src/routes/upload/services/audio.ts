import {db} from "@/db.js";

export const uploadAudio = async (
    id: number,
    file: Express.Multer.File,
) => {
    return db.music.update({
        where: {
            id,
        },
        data: {
            url: file.path,
            status: 'PENDING',
        },
    })
}