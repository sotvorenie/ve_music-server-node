import {db} from "@/db.js";

import {getBackupPreview} from "@composables/useGetBackupPreview.js";

import {musicException} from "@utils/httpExceptions.js";

import {musicBaseWithArtistsSelect} from "@selects/musicSelect.js";

const addMusicToHistory = async (
    userId: number,
    musicId: number,
) => {
    const historyEntry = await db.history.findUnique({
        where: {
            userId_musicId: {
                userId,
                musicId,
            },
        }
    })

    if (historyEntry) {
        await db.history.update({
            where: {
                id: historyEntry.id,
            },
            data: {
                date: new Date(),
            },
        })
    } else {
        await db.history.create({
            data: {
                userId,
                musicId,
            },
        })

        const total = await db.history.count({
            where: {userId}
        })
        if (total > 100) {
            const oldest = await db.history.findFirst({
                where: {userId},
                orderBy: {date: 'asc'},
                select: {id: true},
            })
            if (oldest) {
                await db.history.delete({
                    where: {
                        id: oldest.id,
                    },
                })
            }
        }
    }
}

export const getTrack = async (
    musicId: number,
    isAdmin: boolean = false,
    currentUserId?: number,
    setView: boolean = true
) => {
    if (currentUserId) addMusicToHistory(currentUserId, musicId).catch()

    let [musicFromDB] = await Promise.all([
        db.music.findUnique({
            where: {
                id: musicId,
                ...(!isAdmin && { status: 'READY' })
            },
            select: {
                ...musicBaseWithArtistsSelect,
                url: true,
                previewUrl: true,
                urlWithClip: true,
                likesCount: true,
                auditionsCount: true,
                genre: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                likes: {
                    where: {
                        userId: currentUserId ?? -1,
                    },
                },
                segmentsCount: true,
                bitrates: true,
            }
        }),
        (!isAdmin && setView ? db.music.update({
            where: {
                id: musicId,
            },
            data: {
                auditionsCount: {increment: 1},
            },
        }) : Promise.resolve(0))
    ])

    if (!musicFromDB) throw musicException

    if (!musicFromDB.previewUrl && !isAdmin) {
        musicFromDB.previewUrl = await getBackupPreview()
    }

    return {
        ...musicFromDB,
        isLiked: !!musicFromDB?.likes?.length,
        likes: undefined,
    }
}