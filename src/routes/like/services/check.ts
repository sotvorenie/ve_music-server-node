import {db} from "@/db.js";

export const checkIsLiked = async (
    id: number,
    currentUserId: number,
) => {
    const existingLike = await db.like.findUnique({
        where: {
            userId_musicId: {
                userId: currentUserId,
                musicId: id
            }
        }
    })

    return !!existingLike
}