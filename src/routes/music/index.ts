import { Router, type Request, type Response } from 'express';
import { Prisma } from "@/generated/prisma/client.js";
import {db} from "@/db.js";

import {adminMusicRouter} from "@routes/music/admin.js";
import {getRandomMusicSchema, musicSchemaGenreIdAndArtistIdAndName} from "@routes/music/schemas.js";
import {musicServiceGetMusic} from "@routes/music/services.js";

import {getSkip} from "@composables/useGetSkip.js";
import {getBackupPreview} from "@composables/useGetBackupPreview.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {idSchema} from "@schemas/idSchema.js";
import {isAdminSchema} from "@schemas/isAdminSchema.js";

import {musicAdminSelect, musicBaseWithArtistsSelect} from "@selects/musicSelect.js";

export const musicRouter = Router();

musicRouter.get('/list', asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, name, genre_id: genreId, artist_id: artistId, is_admin: isAdmin} =
        musicSchemaGenreIdAndArtistIdAndName.extend(pageLimitSchema.shape).extend(isAdminSchema.shape).parse(req.query)

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

    let [music, total] = await Promise.all([
        db.music.findMany({
            where,
            skip,
            take: limit,
            select: isAdmin ? musicAdminSelect : musicBaseWithArtistsSelect
        }),
        db.music.count({where})
    ])

    if (!isAdmin) {
        music = await Promise.all(
            music.map(async (m) => {
                m.previewUrl = m.previewUrl || await getBackupPreview()
                return m
            })
        )
    }

    res.json({
        music,
        page,
        limit,
        total,
        hasMore: (skip + limit) < total,
    })
}))

musicRouter.get('/random_list', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const {
        name,
        seed,
        genre_id: genreId,
        artist_id: artistId,
        exclude_id: excludeId,
        page,
        limit,
    } = getRandomMusicSchema.parse(req.query)

    const skip = getSkip(page, limit)

    const conditions: Prisma.Sql[] = []
    const formattedName = name?.trim()
    conditions.push(Prisma.sql`id != ${excludeId}`)
    if (formattedName) conditions.push(Prisma.sql`name ILIKE ${'%' + formattedName + '%'}`)
    if (genreId >= 0) conditions.push(Prisma.sql`genre_id = ${genreId}`)
    if (artistId >= 0) conditions.push(Prisma.sql`id IN (SELECT "B" FROM "_ArtistToMusic" WHERE "A" = ${artistId})`)
    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`

    const [_, rows] = await db.$transaction([
        db.$executeRaw`SELECT setseed(${seed})`,
        db.$queryRaw`SELECT id FROM "musics" ${whereClause} ORDER BY RANDOM() LIMIT ${limit + 1} OFFSET ${skip}`
    ]) as [unknown, {id: number}[]]

    const hasMore = rows?.length > limit
    const formattedRows = rows.map(row => row.id)
    const ids = hasMore ? formattedRows.slice(0, limit) : formattedRows

    res.json({
        ids,
        page,
        limit,
        hasMore,
    })
}))

musicRouter.get('/:id', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {is_admin: isAdmin} = isAdminSchema.parse(req.query)

    const currentUserId = req.user?.id

    await musicServiceGetMusic(res, id, isAdmin, currentUserId)
}))

musicRouter.use('/admin', adminMusicRouter)