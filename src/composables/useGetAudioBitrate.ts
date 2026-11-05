// получаем длительность музыки

import { parseFile } from 'music-metadata';

export const getMusicBitrate = async (musicPath: string): Promise<number> => {
    try {
        const metadata = await parseFile(musicPath)
        const bitrate = metadata.format.bitrate
        return bitrate ? bitrate / 1000 : 0
    } catch (err) {
        console.error('Ошибка при чтении аудио:', err)
        return 0
    }
}