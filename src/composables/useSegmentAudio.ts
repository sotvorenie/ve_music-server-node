import type { Request } from "express";
import { spawn } from 'node:child_process';

export const segmentAudio = (
    inputPath: string,
    outputDir: string,
    segmentTime: number,
    bitrate: number,
    req: Request,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const args = [
            '-i', inputPath,
            '-map', '0:a',
            '-c:a', 'aac',
            '-b:a', `${bitrate}k`,
            '-f', 'hls',
            '-hls_time', String(segmentTime),
            '-hls_playlist_type', 'vod',
            '-hls_segment_type', 'fmp4',
            '-hls_fmp4_init_filename', 'init.mp4',
            '-hls_segment_filename', 'seg_%05d.m4s',
            'playlist.m3u8'
        ]

        const proc = spawn('ffmpeg', args, {
            stdio: ['ignore', 'ignore', 'pipe'],
            cwd: outputDir
        })

        const onClose = () => {
            proc.kill('SIGKILL')
            reject(new Error('aborted'))
        }

        let stderr = ''
        proc.stderr.on('data', (chunk) => { stderr += chunk.toString() })

        req.on('close', onClose)
        proc.on('error', reject)
        proc.on('close', (code) => {
            req.off('close', onClose)
            if (code === 0) resolve()
            else reject(new Error(`ffmpeg exited with ${code}: ${stderr.slice(-500)}`))
        })
    })
}