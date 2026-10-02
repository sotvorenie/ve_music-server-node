import {createUrl} from "@composables/useCreateUrl.js";

export const musicConstantUpdateTypes = {
    preview: (path: string) => ({
        previewUrl: createUrl(path)
    }),
    video: (path: string) => ({
        videoClipUrl: createUrl(path)
    })
}

export const musicConstantUpdateSelectsTypes = {
    audio: {
        url: true
    },
    preview: {
        previewUrl: true
    },
    video: {
        videoClipUrl: true
    }
}