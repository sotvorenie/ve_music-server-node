import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';

ffmpeg.setFfprobePath(ffprobeStatic.path);

export const getVideoInfo = async (
    videoPath: string,
    infoType: 'duration' | 'height' | 'fps' = 'height',
): Promise<number> => {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
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

            if (infoType === 'fps') {
                const raw = videoStream.r_frame_rate ?? videoStream.avg_frame_rate ?? '0'
                const [num = 0, den = 1] = String(raw).split('/').map(Number)
                const fps = den ? num / den : num
                resolve(Number.isFinite(fps) ? fps : 0)
                return
            }

            const value = videoStream[infoType]
            const num = typeof value === 'number' ? value : Number(value)
            resolve(Number.isFinite(num) ? num : 0)
        })
    })
}