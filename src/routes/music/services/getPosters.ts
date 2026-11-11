import path from "node:path";
import fs from "node:fs/promises";

import {ALLOWED_PHOTO_SUFFIX, PREVIEWS_DIRECTORY} from "@/config.js";

import {safeReaddir} from "@composables/useSafeReaddir.js";
import {createUrl} from "@composables/useCreateUrl.js";
import {getSkip} from "@composables/useGetSkip.js";

export const getPosters = async (
    page: number = 1,
    limit: number = 30,
) => {
    const skip = getSkip(page, limit)

    const previewsDirectory = path.join(PREVIEWS_DIRECTORY)

    await fs.mkdir(previewsDirectory, {recursive: true})

    const entries = await safeReaddir(previewsDirectory)
    entries
        .filter(entry => entry.isFile())
        .filter(f => ALLOWED_PHOTO_SUFFIX.has(path.extname(f.name).toLowerCase()))
        .map(photo => createUrl(path.join(previewsDirectory, photo.name)))
        .sort()

    const total = entries.length

    return {
        posters: entries.slice(skip, skip + limit),
        skip,
        total,
    }
}