import path from "node:path";
import {db} from "./db.js";

import {MUSIC_DIRECTORY, ALLOWED_VIDEO_SUFFIX, ALLOWED_PHOTO_SUFFIX, ALLOWED_MUSIC_SUFFIX} from "./config.js";
import {safeReaddir} from "./composables/useSafeReaddir.js";
import {createUrl} from "./composables/useCreateUrl.js";
import {getMusicDuration} from "./composables/useGetAudioDuration.js";

export class DataSynchronizer {
    private musicFromDB = new Map<string, { id: number; url: string; name: string }>()

    private readonly actualMusic = new Set<string>()

    private async loadDataFromDB(): Promise<void> {
        const music = await db.music.findMany({
            select: {
                id: true,
                url: true,
                name: true,
            }
        })
        this.musicFromDB = new Map(music.map(m => [m.url, m]))

        this.actualMusic.clear()
    }

    private async syncMusic(): Promise<void> {
        const videosDir: string = path.join(MUSIC_DIRECTORY, 'videos')
        const previewsDir: string = path.join(MUSIC_DIRECTORY, 'previews')
        const musicDir: string = path.join(MUSIC_DIRECTORY, 'music')

        const musics = await safeReaddir(musicDir)

        for (const music of musics) {
            if (music.isDirectory()) continue

            const musicSuffix = path.extname(music.name).toLowerCase()
            const isValidMusic = ALLOWED_MUSIC_SUFFIX.has(musicSuffix)
            if (!isValidMusic) continue

            const musicFullName = music.name
            const musicName = path.parse(musicFullName).name
            const musicPath = path.join(musicDir, musicFullName)

            const musicUrl = createUrl(musicPath)

            const musicPreviewFile = await this.findFile(
                previewsDir,
                this.allTypes.photo,
                musicName
            )
            const musicPreviewUrl = musicPreviewFile ? createUrl(musicPreviewFile) : null

            const musicVideoClipFile = await this.findFile(
                videosDir,
                this.allTypes.video,
                musicName
            )
            const musicVideoClipUrl = musicVideoClipFile ? createUrl(musicVideoClipFile) : null

            if (this.musicFromDB.has(musicUrl)) {
                await db.music.update({
                    where: {
                        url: musicUrl,
                    },
                    data: {
                        name: musicName,
                        previewUrl: musicPreviewUrl,
                        videoClipUrl: musicVideoClipUrl,
                    }
                })
                console.log(`Обновлена информация о музыке: ${musicName}`)
            } else {
                await db.music.create({
                    data: {
                        name: musicName,
                        url: musicUrl,
                        duration: await getMusicDuration(musicPath),
                    }
                })
                console.log(`Добавлена новая музыка: ${musicName}`)
            }

            this.actualMusic.add(musicUrl)
        }
    }

    private async deleteUnused(): Promise<void> {
        await db.music.deleteMany({
            where: {
                url: {notIn: Array.from(this.actualMusic)}
            }
        })
    }

    private allTypes = {
        video: ALLOWED_VIDEO_SUFFIX,
        photo: ALLOWED_PHOTO_SUFFIX,
    }

    private async findFile(dir: string, type: Set<string>, name: string): Promise<string | null> {
        const files = await safeReaddir(dir)
        const found = files.find(f => {
            const suffix = path.extname(f.name).toLowerCase()
            const isValidType = type.has(suffix)
            if (!isValidType) return false

            return path.parse(f.name).name === path.parse(name).name
        })
        return found ? path.join(dir, found.name) : null
    }

    async sync(): Promise<void> {
        console.log('Синхронизация данных..')

        await this.loadDataFromDB()
        await this.syncMusic()
        await this.deleteUnused()

        console.log('Синхронизация прошла успешно!!')
    }
}
