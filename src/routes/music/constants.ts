export const musicConstantUpdateTypes = {
    audio: (url: string) => ({
        url
    }),
    preview: (url: string) => ({
        previewUrl: url
    }),
    video: (url: string) => ({
        videoClipUrl: url
    })
}