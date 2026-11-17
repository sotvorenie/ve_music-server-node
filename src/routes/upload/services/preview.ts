import {db} from "@/db.js";

import {createPosters} from "@routes/upload/services/helpers.js";

export const uploadPreview = async (
    id: number,
    file: Express.Multer.File,
) => {
    const {url, urlSmall} = await createPosters(file)

    await db.music.update({
        where: {
            id,
        },
        data: {
            previewUrl: url,
            previewX480Url: urlSmall,
        },
    })

    return url
}