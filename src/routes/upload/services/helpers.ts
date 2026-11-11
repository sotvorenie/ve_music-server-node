import path from "node:path";
import fs from "node:fs/promises";

import {ALLOWED_VIDEO_SUFFIX, segmentTime, VIDEOS_DIRECTORY} from "@/config.js";

import {createVideo} from "@composables/useCreateVideo.js";

import {videoFormatException} from "@utils/httpExceptions.js";

export const addVideo = async (
    videoFile: Express.Multer.File,
    audio: {
        id: number,
        duration: number,
    },
): Promise<string> => {
    const videoSuffix = path.extname(videoFile.originalname).toLowerCase()
    if (!ALLOWED_VIDEO_SUFFIX.has(videoSuffix)) throw videoFormatException

    await fs.mkdir(VIDEOS_DIRECTORY, {recursive: true})

    const targetVideoPath = path.join(VIDEOS_DIRECTORY, String(audio.id))
    await fs.mkdir(targetVideoPath, {recursive: true})

    await createVideo(
        videoFile.path,
        targetVideoPath,
        segmentTime,
        audio,
    )

    return targetVideoPath
}