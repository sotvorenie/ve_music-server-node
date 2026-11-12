import path from "node:path";
import fs from "node:fs/promises";
import {db} from "@/db.js";

import {
    ALLOWED_PHOTO_SUFFIX,
    PREVIEWS_DIRECTORY,
    segmentTime,
} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";

import {photoFormatException} from "@utils/httpExceptions.js";

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

    await fs.mkdir(PREVIEWS_DIRECTORY, {recursive: true})

    if (files.preview) {
        targetPreviewPath = path.join(PREVIEWS_DIRECTORY, `${Date.now()}${previewSuffix}`)
        await fs.rename(files.preview.path, targetPreviewPath)
    }

    await Promise.all([
        db.music.create({
            data: {
                name,
                url: files.music.path,
                duration: 0,
                previewUrl: targetPreviewPath ? createUrl(targetPreviewPath) : (previewPath || ''),
                urlWithClip: files.video?.path ?? null,
                genreId,
                artists: {
                    connect: artists.map(artistId => ({id: artistId}))
                },
                codec: 'aac',
                segmentTime,
                status: 'PENDING',
            },
        }),
        db.$executeRaw`NOTIFY music_pending;`
    ])
}