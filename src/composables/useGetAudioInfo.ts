import { parseFile } from 'music-metadata';

export const getAudioInfo = async (
    audioPath: string,
    infoType: 'duration' | 'bitrate',
): Promise<number> => {
    try {
        const metadata = await parseFile(audioPath)
        const value = metadata.format[infoType]
        return value ? Math.ceil(value) : 0
    } catch {
        return 0
    }
}