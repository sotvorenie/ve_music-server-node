import {db} from "@/db.js";

import {segmentTime,} from "@/config.js";

import {createPosters} from "@routes/upload/services/helpers.js";

import {findSmallPosterByUrl} from "@services/findSmallPosterByUrl.js";

export const uploadMusic = async (
    genreId: number,
    artists: number[],
    name: string,
    posterUrl: string | undefined,
    files: {
        music: Express.Multer.File,
        preview: Express.Multer.File | undefined,
        video: Express.Multer.File | undefined,
    }
) => {
    let url = posterUrl ?? null
    let urlSmall = findSmallPosterByUrl(posterUrl) ?? null

    if (files.preview) {
        ({url, urlSmall} = await createPosters(files.preview))
    }

    await Promise.all([
        db.music.create({
            data: {
                name,
                url: files.music.path,
                duration: 0,
                previewUrl: url,
                previewX480Url: urlSmall,
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