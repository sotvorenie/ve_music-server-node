import {createUrl} from "@composables/useCreateUrl.js";

export const musicConstantUpdateTypes = {
    audio: (path: string) => ({
        url: createUrl(path)
    }),
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