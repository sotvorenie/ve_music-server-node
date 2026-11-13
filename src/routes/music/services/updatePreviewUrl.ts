import {db} from "@/db.js";

import {findMobilePosterByUrl} from "@services/findMobilePosterByUrl.js";

export const updatePreviewUrlForTrack = async (
    id: number,
    url: string,
) => {
    const mobilePosterUrl = findMobilePosterByUrl(url)

    return db.music.update({
        where: {
            id,
        },
        data: {
            previewUrl: url,
            previewMobileUrl: mobilePosterUrl,
        },
    })
}