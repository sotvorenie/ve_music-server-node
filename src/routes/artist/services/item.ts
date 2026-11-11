import {db} from "@/db.js";

import {artistAdminSelect} from "@selects/artistSelect.js";

export const getArtist = (
    id: number,
) => {
    return db.artist.findUnique({
        where: {
            id,
        },
        select: artistAdminSelect,
    })
}