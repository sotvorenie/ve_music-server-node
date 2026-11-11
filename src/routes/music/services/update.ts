import {db} from "@/db.js";

export const updateTrack = async (
    id: number,
    genreId: number,
    name: string,
    artists: number[],
) => {
    await db.music.update({
        where: {
            id
        },
        data: {
            name,
            genreId,
            artists: {
                set: artists.map(artistId => ({ id: artistId }))
            },
        }
    })
}