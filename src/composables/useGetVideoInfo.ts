import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';

ffmpeg.setFfprobePath(ffprobeStatic.path);

export const getVideoInfo = async (
    videoPath: string,
    infoType: 'duration' | 'height' | 'nb_frames' = 'height',
): Promise<number> => {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                console.error(`Не удалось прочитать метаданные ${videoPath}:`, err.message)
                resolve(0)
                return
            }

            if (infoType === 'duration') {
                const duration = metadata.format.duration
                resolve(duration ? Number(duration) : 0)
                return
            }

            const videoStream = metadata.streams.find(
                stream => stream.codec_type === 'video',
            )
            if (!videoStream) {
                resolve(0)
                return
            }

            const value = videoStream[infoType]
            resolve(typeof value === 'number' ? value : Number(value) || 0)
        })
    })
}