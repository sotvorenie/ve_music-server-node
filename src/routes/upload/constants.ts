import {ALLOWED_PHOTO_SUFFIX, ALLOWED_VIDEO_SUFFIX} from "@/config.js";

import {photoFormatException, videoFormatException} from "@utils/httpExceptions.js";

export const uploadConstantTypes = {
    preview: {
        title: 'preview',
        allowedSuffix: ALLOWED_PHOTO_SUFFIX,
        formatException: photoFormatException,
        dirName: 'previews',
        data: (previewUrl: string) => ({
            previewUrl,
        })
    },
    video: {
        title: 'video',
        allowedSuffix: ALLOWED_VIDEO_SUFFIX,
        formatException: videoFormatException,
        dirName: 'videos',
        data: (videoUrl: string) => ({
            videoClipUrl: videoUrl,
        })
    }
}