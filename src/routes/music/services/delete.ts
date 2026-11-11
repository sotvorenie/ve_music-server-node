import path from "node:path";
import {db} from "@/db.js";

import {TRACKS_DIRECTORY, VIDEOS_DIRECTORY} from "@/config.js";

import {deletePath} from "@composables/useDeletePath.js";

import {musicException} from "@utils/httpExceptions.js";

export const deleteTrack = async (
    id: number,
) => {
    const music = await db.music.findUnique({
        where: {
            id,
        },
        select: {
            id: true,
        },
    })
    if (!music) throw musicException

    const trackDirectory = path.join(TRACKS_DIRECTORY, String(id))
    const videoClipDirectory = path.join(VIDEOS_DIRECTORY, String(id))

    await Promise.all([
        db.music.delete({where: {id}}),
        deletePath(trackDirectory),
        deletePath(videoClipDirectory),
    ])
}