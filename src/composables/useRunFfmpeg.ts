import type {Request} from "express";
import {spawn} from "node:child_process";

export const runFfmpeg = (
    args: string[],
    cwd: string,
    req: Request,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const proc = spawn('ffmpeg', args, {
            stdio: ['ignore', 'ignore', 'pipe'],
            cwd,
        })

        const onClose = () => {
            proc.kill('SIGKILL')
            reject(new Error('aborted'))
        }

        let stderr = ''
        proc.stderr.on('data', (chunk) => { stderr += chunk.toString() })

        req.on('close', onClose)
        proc.on('error', (e) => {
            req.off('close', onClose)
            reject(e)
        })
        proc.on('close', (code) => {
            req.off('close', onClose)
            if (code === 0) resolve()
            else reject(new Error(`ffmpeg exited with ${code}: ${stderr.slice(-800)}`))
        })
    })
}