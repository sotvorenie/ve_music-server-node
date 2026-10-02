import {type Request, type Response} from "express";
import {db} from "@/db.js";

import {deleteFile} from "@composables/useDeleteFile.js";

import {musicException} from "@utils/httpExceptions.js";

import {idSchema} from "@schemas/idSchema.js";

import {musicBaseWithArtistsSelect} from "@selects/musicSelect.js";

import {successResponse} from "@responses/successResponse.js";

const musicServiceAddMusicToHistory = async (userId: number, musicId: number) => {
    const historyEntry = await db.history.findUnique({
        where: {
            userId_musicId: {
                userId,
                musicId
            }
        }
    })

    if (historyEntry) {
        await db.history.update({
            where: {
                id: historyEntry.id
            },
            data: {
                date: new Date()
            }
        })
    } else {
        await db.history.create({
            data: {
                userId,
                musicId
            }
        })

        const total = await db.history.count({
            where: {userId}
        })
        if (total > 100) {
            const oldest = await db.history.findFirst({
                where: {userId},
                orderBy: {date: 'asc'},
                select: {id: true}
            })
            if (oldest) {
                await db.history.delete({
                    where: {
                        id: oldest.id
                    }
                })
            }
        }
    }
}

export const musicServiceGetMusic = async (
    res: Response,
    musicId: number,
    updateAuditions: boolean = true,
    currentUserId?: number,
) => {
    if (currentUserId) musicServiceAddMusicToHistory(currentUserId, musicId).catch(err => {
        console.error('Ошибка добавления музыки в историю: ', err)
    })

    let [musicFromDB] = await Promise.all([
        db.music.findUnique({
            where: {
                id: musicId
            },
            select: {
                ...musicBaseWithArtistsSelect,
                url: true,
                previewUrl: true,
                videoClipUrl: true,
                likesCount: true,
                auditionsCount: true,
                genre: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                likes: {
                    where: {
                        userId: currentUserId ?? -1
                    }
                },
            }
        }),
        (updateAuditions ? db.music.update({
            where: {
                id: musicId
            },
            data: {
                auditionsCount: {increment: 1}
            }
        }) : Promise.resolve(0))
    ])

    if (!musicFromDB) throw musicException

    const music = {
        ...musicFromDB,
        isLiked: !!musicFromDB?.likes?.length,
        likes: undefined,
    }

    res.json(music)
}

export const musicServiceUpdateUrl = async (
    req: Request,
    res: Response,
    data: any,
    select: any,
) => {
    const {id} = idSchema.parse(req.params)

    const url = await db.music.update({
        where: {
            id
        },
        data,
        select
    })

    res.json({
        url: url[Object.keys(select)[0] as string]
    })
}

export const musicServiceDeleteFromDBAndFile = async (req: Request, res: Response, data: any) => {
    const {id} = idSchema.parse(req.params)

    const urlKey = Object.keys(data)[0] ?? 'url'

    const url = await db.music.findUnique({
        where: {
            id
        },
        select: {
            [urlKey]: true
        }
    }) as Record<string, string | null> | null

    req.checkAborted()
    await Promise.all([
        db.music.update({
            where: {
                id
            },
            data,
        }),
        deleteFile(url?.[urlKey] || '')
    ])

    successResponse(res)
}
