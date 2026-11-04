import {artistBaseSelect} from "@selects/artistSelect.js";

export const musicBaseSelect = {
    id: true,
    name: true,
    duration: true,
    previewUrl: true,
}

export const musicBaseWithArtistsSelect = {
    ...musicBaseSelect,
    artists: {
        select: artistBaseSelect
    },
    segmentsCount: true,
}

export const musicAdminSelect = {
    ... musicBaseWithArtistsSelect,
    createdAt: true,
    updatedAt: true,
}