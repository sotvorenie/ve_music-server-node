import {db} from "@/db.js";

import {findSmallPosterByUrl} from "@services/findSmallPosterByUrl.js";

export const updatePreviewUrlForTrack = async (
    id: number,
    url: string,
) => {
    const smallPosterUrl = findSmallPosterByUrl(url)

    return db.music.update({
        where: {
            id,
        },
        data: {
            previewUrl: url,
            previewX480Url: smallPosterUrl,
        },
    })
}