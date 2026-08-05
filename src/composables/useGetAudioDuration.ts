// получаем длительность музыки

import { parseFile } from 'music-metadata';

export const getMusicDuration = async (musicPath: string): Promise<number> => {
    try {
        const metadata = await parseFile(musicPath)
        const duration = metadata.format.duration
        return duration ? Math.ceil(duration) : 0
    } catch (err) {
        console.error('Ошибка при чтении аудио:', err)
        return 0
    }
}