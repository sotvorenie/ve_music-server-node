import {artistBaseSelect} from "@selects/artistSelect.js";

export const musicBaseSelect = {
    id: true,
    name: true,
    duration: true,
    previewUrl: true,
    previewX480Url: true,
    url: true,
}

export const musicFullSelect = {
    ...musicBaseSelect,
    urlWithClip: true,
    likesCount: true,
    auditionsCount: true,
    segmentsCount: true,
    bitrates: true,
    artists: {
        select: artistBaseSelect
    },
}

export const musicAdminSelect = {
    ...musicFullSelect,
    status: true,
    createdAt: true,
    updatedAt: true,
}