import { Router, type Request, type Response } from 'express';
import { Prisma } from "../generated/prisma/client.js";
import {z} from "zod";
import {db} from "../db.js";

import {asyncHandler} from "../utils/asyncHandler.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {getSkip} from "../composables/useGetSkip.js";
import {getUser} from "../utils/auth.js";
import {musicException} from "../utils/httpExceptions.js";
import {musicBaseWithArtistsSelect} from "../selects/musicSelect.js";
import {nameSchema} from "../schemas/nameSchema.js";
import {idSchema} from "../schemas/idSchema.js";

export const musicRouter = Router();

const genreIdAndArtistIdAndNameSchema = nameSchema.extend({
    genre_id: z.string().transform(Number),
    artist_id: z.string().transform(Number),
})

const addMusicToHistory = async (userId: number, musicId: number) => {
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

const getMusic = async (
    res: Response,
    musicId: number,
    currentUserId?: number
) => {
    if (currentUserId) addMusicToHistory(currentUserId, musicId).catch(err => {
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

musicRouter.get('/list', asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, name, genre_id: genreId, artist_id: artistId} =
        genreIdAndArtistIdAndNameSchema.extend(pageLimitSchema.shape).parse(req.query)

    const skip = getSkip(page, limit)

    const where = {
        ...(name && {
            name: {
                contains: name,
                mode: 'insensitive' as const
            }
        }),
        ...(genreId >= 0 && { genreId }),
        ...(artistId >= 0 && {
            artists: {
                some: {
                    id: artistId
                }
            }
        })
    }

    const [music, total] = await Promise.all([
        db.music.findMany({
            where,
            skip,
            take: limit,
            select: musicBaseWithArtistsSelect
        }),
        db.music.count({where})
    ])

    res.json({
        music,
        page,
        limit,
        total,
        hasMore: (skip + limit) < total,
    })
}))

musicRouter.get('/:id', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const currentUserId = req.user?.id

    await getMusic(res, id, currentUserId)
}))

const getRandomMusicSchema = genreIdAndArtistIdAndNameSchema.extend({
    seed: z.string().transform(Number),
    offset: z.string().transform(Number),
})
musicRouter.get('/random', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const {
        name,
        seed,
        offset,
        genre_id: genreId,
        artist_id: artistId
    } = getRandomMusicSchema.parse(req.query)
    const currentUserId = req.user?.id

    const conditions: Prisma.Sql[] = []
    const formattedName = name?.trim()
    if (formattedName) conditions.push(Prisma.sql`name ILIKE ${'%' + formattedName + '%'}`)
    if (genreId >= 0) conditions.push(Prisma.sql`genre_id = ${genreId}`)
    if (artistId >= 0) conditions.push(Prisma.sql`id IN (SELECT "B" FROM "_ArtistToMusic" WHERE "A" = ${artistId})`)
    const whereClause = conditions?.length
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty

    const [_, [firstRow]] = await db.$transaction([
        db.$executeRaw`SELECT setseed(${seed})`,
        db.$queryRaw`SELECT id FROM "musics" ${whereClause} ORDER BY RANDOM() LIMIT 1 OFFSET ${offset}`
    ]) as [unknown, {id: number}[]]
    const musicId = firstRow?.id
    if (!musicId) throw musicException

    await getMusic(res, musicId, currentUserId)
}))