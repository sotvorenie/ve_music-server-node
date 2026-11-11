import fs from "node:fs/promises";
import {db} from "@/db.js";

import {addVideo} from "@routes/upload/services/helpers.js";
import {createUrl} from "@composables/useCreateUrl.js";

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

    await fs.rm(file.path, {force: true}).catch()

    return createUrl(targetPath)
}