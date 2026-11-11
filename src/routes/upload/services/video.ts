import {db} from "@/db.js";

import {addVideo} from "@routes/upload/services/helpers.js";

import {createUrl} from "@composables/useCreateUrl.js";
import {deletePath} from "@composables/useDeletePath.js";

import {musicException} from "@utils/httpExceptions.js";

export const uploadVideo = async (
    id: number,
    file: Express.Multer.File,
) => {
    const musicInfo = await db.music.findUnique({
        where: {
            id,
        },
        select: {
            duration: true,
        }
    })

    if (!musicInfo) throw musicException

    const targetPath = await addVideo(
        file,
        {
            id,
            duration: musicInfo.duration,
        },
    )

    await deletePath(file.path)

    return createUrl(targetPath)
}