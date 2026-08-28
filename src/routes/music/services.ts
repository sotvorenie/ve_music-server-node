import {type Request, type Response} from "express";
import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {musicSchemaUrl} from "@routes/music/schemas.js";

import {BASE_STORAGE_DIR} from "@/config.js";

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
    currentUserId?: number
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
                likes: {
                    where: {
                        userId: currentUserId ?? -1
                    }
                }
            }
        }),
        db.music.update({
            where: {
                id: musicId
            },
            data: {
                auditionsCount: {increment: 1}
            }
        })
    ])

    if (!musicFromDB) throw musicException

    const music = {
        ...musicFromDB,
        isLiked: !!musicFromDB?.likes?.length,
        likes: undefined,
    }

    res.json(music)
}

export const musicServiceUpdateUrl = async (req: Request, res: Response, data: any) => {
    const {id} = idSchema.parse(req.params)

    await db.music.update({
        where: {
            id
        },
        data
    })

    successResponse(res)
}

export const musicServiceDeleteFile = async (url: string | undefined) => {
    if (!url) return
    const filePath = path.join(BASE_STORAGE_DIR, url)

    try {
        await fs.unlink(filePath)
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            console.log('Старый файл аватарки не найден, пропускаем удаление')
        } else {
            console.error('Ошибка при удалении аватарки:', err)
        }
    }
}

export const musicServiceCleanUrl = (fileUrl: string | null | undefined) => fileUrl?.replace('/static/', '')

export const musicServiceDeleteFromDBAndFile = async (req: Request, res: Response, data: any) => {
    const {id} = idSchema.parse(req.params)
    const {url} = musicSchemaUrl.parse(req.body)

    const formattedUrl = url.replace('/static/', '')

    req.checkAborted()
    await Promise.all([
        db.music.update({
            where: {
                id
            },
            data,
        }),
        musicServiceDeleteFile(formattedUrl)
    ])

    successResponse(res)
}
