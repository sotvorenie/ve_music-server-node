import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {ALLOWED_MUSIC_SUFFIX, segmentTime, TRACKS_DIRECTORY} from "@/config.js";

import {getAudioInfo} from "@composables/useGetAudioInfo.js";
import {createAudio} from "@composables/useCreateAudio.js";
import {createUrl} from "@composables/useCreateUrl.js";

import {audioFormatException} from "@utils/httpExceptions.js";

export const uploadAudio = async (
    id: number,
    file: Express.Multer.File,
) => {
    const suffix = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_MUSIC_SUFFIX.has(suffix)) throw audioFormatException

    await fs.mkdir(TRACKS_DIRECTORY, {recursive: true})

    const targetPath = path.join(TRACKS_DIRECTORY, String(id))

    const duration = await getAudioInfo(file.path, 'duration')

    const {bitrates, segmentsCount} = await createAudio(file.path, targetPath, segmentTime)

    const url = createUrl(targetPath)

    await db.music.update({
        where: {
            id
        },
        data: {
            url,
            duration,
            segmentsCount,
            bitrates,
        }
    })

    return url
}