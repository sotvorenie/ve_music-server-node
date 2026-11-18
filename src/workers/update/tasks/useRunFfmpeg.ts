import {spawn} from "node:child_process";

export const runFfmpeg = (
    args: string[],
    cwd: string,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const proc = spawn('ffmpeg', args, {
            stdio: ['ignore', 'ignore', 'ignore'],
            cwd,
        })

        proc.on('error', (e) => {
            reject(e)
        })
        proc.on('close', (code, signal) => {
            if (code === 0) resolve()
            else reject(new Error(signal ? `ffmpeg killed by ${signal}` : `ffmpeg exited with ${code}`))
        })
    })
}