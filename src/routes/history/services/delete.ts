import {db} from "@/db.js";

export const deleteHistory = async (
    userId: number,
    musicId: number,
) => {
    await db.history.delete({
        where: {
            userId_musicId: {
                userId,
                musicId
            }
        }
    })
}