import path from "node:path";
import fs from "node:fs/promises";
import {spawn} from "node:child_process";

import {getAudioInfo} from "@composables/useGetAudioInfo.js";
import {safeReaddir} from "@composables/useSafeReaddir.js";
import {getMasterPath} from "@composables/useGetMasterPath.js";

import {musicBitrateException} from "@utils/httpExceptions.js";

const runFfmpeg = (
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

const segmentAudio = async (
    inputPath: string,
    outputDir: string,
    segmentTime: number,
    bitrate: number,
): Promise<void> => {
    const args = [
        '-i', inputPath,
        '-map', '0:a:0',
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

    await runFfmpeg(args, outputDir)
}

const getSegmentsCount = async (
    musicPath: string,
) => {
    let segmentsCount: number = 0
    const entries = await safeReaddir(musicPath)
    const firstFolder = entries.find(entry => entry.isDirectory())
    if (firstFolder) {
        const folderPath = path.join(musicPath, firstFolder.name)
        const files = await safeReaddir(folderPath)
        segmentsCount = files.filter(file => file.name.endsWith('.m4s')).length
    }

    return segmentsCount
}

export const createAudio = async (
    audioId: number,
    inputPath: string,
    outputDir: string,
    segmentTime: number,
) => {
    const baseBitrates: number[] = [128]

    const originalBitrate: number = Math.round(await getAudioInfo(inputPath, 'bitrate') / 1000)
    if (originalBitrate === 0) throw musicBitrateException

    const targetBitrates = baseBitrates.filter(bitrate => bitrate * 1.1 <= originalBitrate)

    if (!targetBitrates?.includes(originalBitrate)) {
        targetBitrates.push(originalBitrate)
        targetBitrates.sort((a, b) => a - b)
    }

    await fs.mkdir(outputDir, { recursive: true })

    for (const bitrate of targetBitrates) {
        const bitrateDir = path.join(outputDir, `${bitrate}k`)
        await fs.mkdir(bitrateDir, {recursive: true})

        await segmentAudio(
            inputPath,
            bitrateDir,
            segmentTime,
            bitrate,
        )
    }

    let masterContent = '#EXTM3U\n'
    for (const bitrate of targetBitrates) {
        const bandwidth = Math.round(bitrate * 1000 * 1.1)
        masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},CODECS="mp4a.40.2"\n`
        masterContent += `${bitrate}k/playlist.m3u8\n`
    }
    await fs.writeFile(getMasterPath(audioId), masterContent)

    const segmentsCount = await getSegmentsCount(outputDir)

    return {
        bitrates: targetBitrates,
        segmentsCount,
    }
}