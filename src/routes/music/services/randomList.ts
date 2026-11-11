import { Prisma } from "@/generated/prisma/client.js";
import {db} from "@/db.js";

import {getSkip} from "@composables/useGetSkip.js";

export const getRandomIds = async (
    genreId: number,
    artistId: number,
    excludeId: number,
    seed: number,
    name: string | undefined,
    page: number,
    limit: number,
) => {
    const skip = getSkip(page, limit)

    const conditions: Prisma.Sql[] = []
    const formattedName = name?.trim()
    conditions.push(Prisma.sql`id != ${excludeId}`)
    conditions.push(Prisma.sql`status = 'READY'`)
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

    return {
        ids: hasMore ? formattedRows.slice(0, limit) : formattedRows,
        hasMore,
    }
}