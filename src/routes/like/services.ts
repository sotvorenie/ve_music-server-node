import { type Request, type Response } from 'express';
import {db} from "@/db.js";

import {idSchema} from "@schemas/idSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const likeService = async (
    req: Request,
    res: Response,
    currentUserId: number,
    isAdmin: boolean = false
) => {
    const {id} = idSchema.parse(req.params)

    const existingLike = await db.like.findUnique({
        where: {
            userId_musicId: {
                userId: currentUserId,
                musicId: id
            }
        }
    })

    if (existingLike && isAdmin) return successResponse(res)

    let isLiked = false

    await db.$transaction(async (tx) => {
        if (existingLike) {
            await tx.like.delete({
                where: {
                    userId_musicId: {
                        userId: currentUserId,
                        musicId: id
                    }
                }
            })
            await tx.music.update({
                where: {
                    id
                },
                data: {
                    likesCount: {decrement: 1}
                }
            })
        } else {
            await tx.like.create({
                data: {
                    userId: currentUserId,
                    musicId: id,
                }
            })
            await tx.music.update({
                where: {
                    id
                },
                data: {
                    likesCount: {increment: 1}
                }
            })
            isLiked = true
        }
    })

    res.json({
        isLiked,
    })
}