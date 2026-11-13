import path from "node:path";
import fs from "node:fs/promises";
import sharp from 'sharp';

import {ALLOWED_PHOTO_SUFFIX, PREVIEWS_DIRECTORY} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";
import {deletePath} from "@composables/useDeletePath.js";

import {photoFormatException} from "@utils/httpExceptions.js";

export const createPosters = async (
    file: Express.Multer.File,
) => {
    const suffix = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_PHOTO_SUFFIX.has(suffix)) throw photoFormatException

    let targetPath : string | null = null
    let targetMobilePath : string | null = null

    try {
        await fs.mkdir(PREVIEWS_DIRECTORY, {recursive: true})

        const dateNow = Date.now()

        targetPath = path.join(PREVIEWS_DIRECTORY, `${dateNow}.webp`)
        targetMobilePath = path.join(PREVIEWS_DIRECTORY, `${dateNow}_mobile.webp`)

        await Promise.all([
            sharp(file.path)
                .webp({quality: 80})
                .toFile(targetPath),
            sharp(file.path)
                .resize(480, 480, {
                    fit: "cover",
                    withoutEnlargement: true,
                })
                .webp({quality: 80})
                .toFile(targetMobilePath)
        ])

        return {
            url: createUrl(targetPath),
            urlSmall: createUrl(targetMobilePath),
        }
    } catch (err) {
        if (targetPath) await deletePath(targetPath)
        if (targetMobilePath) await deletePath(targetMobilePath)

        throw err
    }
}