import path from "node:path";
import fs from "node:fs/promises";

import {getAudioInfo} from "@composables/useGetAudioInfo.js";
import {runFfmpeg} from "@composables/useRunFfmpeg.js";
import {deletePath} from "@composables/useDeletePath.js";
import {safeReaddir} from "@composables/useSafeReaddir.js";

import {musicBitrateException} from "@utils/httpExceptions.js";

const segmentAudio = async (
    inputPath: string,
    outputDir: string,
    segmentTime: number,
    bitrate: number,
): Promise<void> => {
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
    inputPath: string,
    outputDir: string,
    segmentTime: number,
) => {
    const baseBitrates: number[] = [128]

    const originalBitrate: number = await getAudioInfo(inputPath, 'bitrate')
    if (originalBitrate === 0) throw musicBitrateException

    const targetBitrates = baseBitrates.filter(bitrate => bitrate * 1.1 <= originalBitrate)

    if (!targetBitrates?.includes(originalBitrate)) {
        targetBitrates.push(originalBitrate)
        targetBitrates.sort((a, b) => a - b)
    }

    await fs.mkdir(outputDir, { recursive: true })

    try {
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
        await fs.writeFile(path.join(outputDir, 'master.m3u8'), masterContent)

        const segmentsCount = await getSegmentsCount(outputDir)

        return {
            bitrates: targetBitrates,
            segmentsCount,
        }
    } catch (err) {
        await deletePath(outputDir)
        throw err
    }
}