import {Prisma} from "@/generated/prisma/client.js";
import {db} from "@/db.js";

import {getSkip} from "@composables/useGetSkip.js";
import {getBackupPreview} from "@composables/useGetBackupPreview.js";

import {musicAdminSelect, musicBaseWithArtistsSelect} from "@selects/musicSelect.js";

export const getTracks = async (
    genreId: number,
    artistId: number,
    page: number,
    limit: number,
    name: string | undefined,
    isAdmin: boolean = false,
) => {
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
        }),
        ...(!isAdmin && { status: 'READY' }),
    } satisfies Prisma.MusicWhereInput

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

    return {
        music,
        total,
        skip,
    }
}