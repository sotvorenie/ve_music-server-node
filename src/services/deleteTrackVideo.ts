import path from "node:path";
import {db} from "@/db.js";

import {TRACKS_DIRECTORY, VIDEOS_DIRECTORY} from "@/config.js";

import {deletePath} from "@composables/useDeletePath.js";

export const deleteTrackVideo = async (
    id: number,
) => {
    const videoPath = path.join(VIDEOS_DIRECTORY, String(id))

    const withClipMasterPath = path.join(TRACKS_DIRECTORY, String(id), 'master_with_clip.m3u8')

    await Promise.all([
        db.music.update({
            where: {
                id,
            },
            data: {
                urlWithClip: null,
            },
        }),
        deletePath(videoPath),
        deletePath(withClipMasterPath)
    ])
}