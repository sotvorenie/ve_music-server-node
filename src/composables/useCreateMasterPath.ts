import path from "node:path";

import {TRACKS_DIRECTORY} from "@/config.js";

export const createMasterPath = (
    id: number,
    masterType: 'audio' | 'video' = 'audio',
) => {
    return path.join(TRACKS_DIRECTORY, String(id), masterType === 'audio' ? 'master.m3u8' : 'master_with_clip.m3u8')
}