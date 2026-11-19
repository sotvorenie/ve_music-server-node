import path from "node:path";

import {TRACKS_DIRECTORY} from "@/config.js";

export const getMasterPath = (
    id: number,
) => {
    return path.join(TRACKS_DIRECTORY, String(id), 'master.m3u8')
}