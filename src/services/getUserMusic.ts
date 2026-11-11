import {getSkip} from "@composables/useGetSkip.js";
import {getBackupPreview} from "@composables/useGetBackupPreview.js";

import {musicBaseWithArtistsSelect} from "@selects/musicSelect.js";

export const getUserMusic = async (
    currentUserId: number,
    page: number,
    limit: number,
    name: string | undefined,
    model: any,
    isAdmin: boolean = false,
) => {

    const skip = getSkip(page, limit)

    const where = {
        userId: currentUserId,
        music : {
            ...(!isAdmin && { status: 'READY' }),
            ...(name?.length && {
                name: {
                    contains: name,
                    mode: 'insensitive' as const
                }
            }),
        },
    }

    const [music, total] = await Promise.all([
        model.findMany({
            where,
            select: {
                music: {
                    select: musicBaseWithArtistsSelect
                }
            },
            skip,
            take: limit,
            orderBy: {
                date: isAdmin ? 'desc' : 'asc'
            }
        }),
        model.count({where})
    ])

   const formattedMusic =  Promise.all(
        music.map(async (m: any) => {
            m.music.previewUrl = m.music.previewUrl || await getBackupPreview()
            return m.music
        })
   )

    return {
        music: formattedMusic,
        total,
        skip,
    }
}