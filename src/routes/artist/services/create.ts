import {db} from "@/db.js";

import {uploadAvatar} from "@routes/artist/services/helpers.js";

export const createArtist = async (
    name: string,
    avatarFile: Express.Multer.File,
) => {
    const {id} = await db.artist.create({
        data: {
            name,
        },
        select: {
            id: true,
        }
    })

    return await uploadAvatar(id, avatarFile)
}