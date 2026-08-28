import {ALLOWED_MUSIC_SUFFIX, ALLOWED_PHOTO_SUFFIX, ALLOWED_VIDEO_SUFFIX} from "@/config.js";
import {audioFormatException, photoFormatException, videoFormatException} from "@utils/httpExceptions.js";
import {getMusicDuration} from "@composables/useGetAudioDuration.js";

export const uploadConstantTypes = {
    audio: {
        title: 'music',
        allowedSuffix: ALLOWED_MUSIC_SUFFIX,
        formatException: audioFormatException,
        dirName: 'music',
        data: async (musicUrl: string, targetPath: string) => ({
            url: musicUrl,
            duration: await getMusicDuration(targetPath),
        })
    },
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