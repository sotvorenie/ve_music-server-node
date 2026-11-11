import {db} from "@/db.js";

export const updateAuditionsForTrack = async (
    id: number,
    auditionsCount: number,
) => {
    await db.music.update({
        where: {
            id
        },
        data: {
            auditionsCount,
        }
    })
}