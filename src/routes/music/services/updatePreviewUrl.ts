import {db} from "@/db.js";

export const updatePreviewUrlForTrack = async (
    id: number,
    url: string,
) => {
    await db.music.update({
        where: {
            id,
        },
        data: {
            previewUrl: url,
        },
    })
}