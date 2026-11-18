import {db} from "@/db.js";

export const deleteTrack = async (
    id: number,
) => {
    await db.music.update({
        where: {
            id,
        },
        data: {
            status: 'FAILED',
        },
    })

    await db.$executeRaw`NOTIFY delete_pending;`
}