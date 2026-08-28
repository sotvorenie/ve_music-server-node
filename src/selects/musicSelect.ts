import {artistBaseSelect} from "@selects/artistSelect.js";

export const musicBaseSelect = {
    id: true,
    name: true,
    duration: true,
}

export const musicBaseWithArtistsSelect = {
    ...musicBaseSelect,
    artists: {
        select: artistBaseSelect
    }
}