import path from "node:path";
import {db} from "@/db.js";

import {PREVIEWS_DIRECTORY} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";

const findSmallPosterByPath = (
    posterPath: string,
) => {
    const {name} = path.parse(posterPath)

    return createUrl(path.join(PREVIEWS_DIRECTORY, `${name}_mobile.webp`))
}

export const updatePreviewPathForTrack = async (
    id: number,
    path: string,
) => {
    const smallPosterUrl = findSmallPosterByPath(path)

    const data = await db.music.update({
        where: {
            id,
        },
        data: {
            previewUrl: createUrl(path),
            previewX480Url: smallPosterUrl,
        },
        select: {
            previewUrl: true,
        },
    })

    return data.previewUrl
}