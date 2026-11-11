import path from "node:path";
import {db} from "@/db.js";

import {VIDEOS_DIRECTORY} from "@/config.js";

import {deletePath} from "@composables/useDeletePath.js";

import {musicException} from "@utils/httpExceptions.js";

export const deleteTrack = async (
    id: number,
) => {
    const music = await db.music.findUnique({
        where: {
            id
        }
    })
    if (!music) throw musicException

    await db.music.delete({
        where: {
            id
        }
    })

    const videoClipPath = path.join(VIDEOS_DIRECTORY, String(id))

    await Promise.all([
        deletePath(music.url),
        deletePath(videoClipPath),
    ])
}