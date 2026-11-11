import {db} from "@/db.js";

export const like = async (
    id: number,
    currentUserId: number,
) => {
    const existingLike = await db.like.findUnique({
        where: {
            userId_musicId: {
                userId: currentUserId,
                musicId: id,
            },
        },
        select: {
            id: true,
        },
    })

    let isLiked = false

    await db.$transaction(async (tx) => {
        if (existingLike) {
            await tx.like.delete({
                where: {
                    userId_musicId: {
                        userId: currentUserId,
                        musicId: id,
                    },
                },
            })
            await tx.music.update({
                where: {
                    id,
                },
                data: {
                    likesCount: {decrement: 1},
                },
            })
        } else {
            await tx.like.create({
                data: {
                    userId: currentUserId,
                    musicId: id,
                },
            })
            await tx.music.update({
                where: {
                    id,
                },
                data: {
                    likesCount: {increment: 1},
                },
            })
            isLiked = true
        }
    })

    return isLiked
}