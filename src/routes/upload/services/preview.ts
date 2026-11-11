import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {ALLOWED_PHOTO_SUFFIX, PREVIEWS_DIRECTORY} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";

import {photoFormatException} from "@utils/httpExceptions.js";

export const uploadPreview = async (
    id: number,
    file: Express.Multer.File,
) => {
    const suffix = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_PHOTO_SUFFIX.has(suffix)) throw photoFormatException

    await fs.mkdir(PREVIEWS_DIRECTORY, {recursive: true})

    const targetPath = path.join(PREVIEWS_DIRECTORY, `${Date.now()}${suffix}`)
    await fs.rename(file.path, targetPath)

    const url = createUrl(targetPath)

    await db.music.update({
        where: {
            id,
        },
        data: {
            previewUrl: url,
        },
    })

    return url
}