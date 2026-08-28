import { Router, type Request, type Response } from 'express';
import { Prisma } from "@/generated/prisma/client.js";
import {z} from "zod";
import {db} from "@/db.js";

import {musicSchemaGenreIdAndArtistIdAndName} from "@routes/music/schemas.js";
import {musicServiceGetMusic} from "@routes/music/services.js";

import {getSkip} from "@composables/useGetSkip.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";
import {musicException} from "@utils/httpExceptions.js";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {idSchema} from "@schemas/idSchema.js";

import {musicBaseWithArtistsSelect} from "@selects/musicSelect.js";

export const musicRouter = Router();

musicRouter.get('/list', asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, name, genre_id: genreId, artist_id: artistId} =
        musicSchemaGenreIdAndArtistIdAndName.extend(pageLimitSchema.shape).parse(req.query)

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

    await musicServiceGetMusic(res, id, currentUserId)
}))

const getRandomMusicSchema = musicSchemaGenreIdAndArtistIdAndName.extend({
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

    await musicServiceGetMusic(res, musicId, currentUserId)
}))