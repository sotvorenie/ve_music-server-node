import path from "node:path";
import {db} from "@/db.js";

import {VIDEOS_DIRECTORY} from "@/config.js";

import {deletePath} from "@composables/useDeletePath.js";

export const deleteVideoForTrack = async (
    id: number,
) => {
    const videoPath = path.join(VIDEOS_DIRECTORY, String(id))

    await Promise.all([
        db.music.update({
            where: {
                id
            },
            data: {
                urlWithClip: null,
            },
        }),
        deletePath(videoPath)
    ])
}