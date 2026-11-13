import {db} from "@/db.js";

export const deletePreviewForTrack = async (
    id: number,
) => {
    await db.music.update({
        where: {
            id
        },
        data: {
            previewUrl: null,
            previewMobileUrl: null,
        },
    })
}