import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {
    ALLOWED_MUSIC_SUFFIX,
    ALLOWED_PHOTO_SUFFIX,
    PREVIEWS_DIRECTORY,
    segmentTime,
    TRACKS_DIRECTORY
} from "@/config.js";

import {addVideo} from "@routes/upload/services/helpers.js";

import {createUrl} from "@composables/useCreateUrl.js";
import {getAudioInfo} from "@composables/useGetAudioInfo.js";
import {createAudio} from "@composables/useCreateAudio.js";
import {safeReaddir} from "@composables/useSafeReaddir.js";
import {deletePath} from "@composables/useDeletePath.js";

import {audioFormatException, photoFormatException} from "@utils/httpExceptions.js";

const addMusic = async (
    audioFile: Express.Multer.File,
    title: string,
    genreId: number,
    artistsIds: number[],
    codec: string,
) => {
    let id: number = -1

    const musicSuffix = path.extname(audioFile.originalname).toLowerCase()
    if (!ALLOWED_MUSIC_SUFFIX.has(musicSuffix)) throw audioFormatException

    try {
        const duration = await getAudioInfo(audioFile.path, 'duration')

        await fs.mkdir(TRACKS_DIRECTORY, {recursive: true})

        const music = await db.music.create({
            data: {
                name: title,
                url: `pending-${crypto.randomUUID()}`,
                duration,
                previewUrl: '',
                urlWithClip: null,
                genreId,
                artists: {
                    connect: artistsIds.map(artistId => ({id: artistId}))
                },
                codec,
                segmentTime,
                status: 'PROCESSING',
            },
            select: {
                id: true,
            }
        })
        id = music.id

        const targetMusicPath = path.join(TRACKS_DIRECTORY, String(id))
        await fs.mkdir(targetMusicPath, {recursive: true})

        const bitrates = await createAudio(
            audioFile.path,
            targetMusicPath,
            segmentTime,
        )

        let segmentsCount: number = 0
        const entries = await safeReaddir(targetMusicPath)
        const firstFolder = entries.find(entry => entry.isDirectory())
        if (firstFolder) {
            const folderPath = path.join(targetMusicPath, firstFolder.name)
            const files = await safeReaddir(folderPath)
            segmentsCount = files.filter(file => file.name.endsWith('.m4s')).length
        }

        return {
            id,
            duration,
            segmentsCount,
            bitrates,
            targetMusicPath,
        }
    } catch (err) {
        if (id !== -1) {
            await deletePath(path.join(TRACKS_DIRECTORY, String(id)))
            await db.music.delete({ where: { id } }).catch()
        }
        throw err
    }
}

export const uploadMusic = async (
    genreId: number,
    artists: number[],
    name: string,
    previewPath: string,
    files: {
        music: Express.Multer.File,
        preview: Express.Multer.File | undefined,
        video: Express.Multer.File | undefined,
    }
) => {
    let previewSuffix: string = ''
    if (files.preview) {
        previewSuffix = path.extname(files.preview.originalname).toLowerCase()
        if (!ALLOWED_PHOTO_SUFFIX.has(previewSuffix)) throw photoFormatException
    }

    let targetPreviewPath: string | null = null
    let targetVideoPath: string | null = null

    await fs.mkdir(PREVIEWS_DIRECTORY, {recursive: true})

    if (files.preview) {
        targetPreviewPath = path.join(PREVIEWS_DIRECTORY, `${Date.now()}${previewSuffix}`)
        await fs.rename(files.preview.path, targetPreviewPath)
    }

    const result = await addMusic(
        files.music,
        name,
        genreId,
        artists,
        'aac',
    )
    const {id, duration, segmentsCount, bitrates} = result

    await deletePath(files.music.path)

    if (!!files.video) {
        targetVideoPath = await addVideo(
            files.video,
            {
                id,
                duration,
            },
        )
        await deletePath(files.video.path)
    }

    return db.music.update({
        where: {
            id
        },
        data: {
            url: createUrl(path.join(TRACKS_DIRECTORY, String(id), 'master.m3u8')),
            previewUrl: targetPreviewPath ? createUrl(targetPreviewPath) : (previewPath || ''),
            urlWithClip: targetVideoPath ? createUrl(targetVideoPath) : '',
            status: 'READY',
            segmentsCount,
            bitrates,
        }
    })
}