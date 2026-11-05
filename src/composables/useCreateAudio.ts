import type {Request} from "express";
import path from "node:path";
import fs from "node:fs/promises";

import {getMusicBitrate} from "@composables/useGetAudioBitrate.js";
import {segmentAudio} from "@composables/useSegmentAudio.js";

import {musicBitrateException} from "@utils/httpExceptions.js";

export const createAudio = async (
    inputPath: string,
    outputDir: string,
    segmentTime: number,
    req: Request,
): Promise<number[]> => {
    const baseBitrates: number[] = [64, 128, 192, 256]

    const originalBitrate: number = await getMusicBitrate(inputPath)
    if (originalBitrate === 0) throw musicBitrateException

    const targetBitrates = baseBitrates.filter(bitrate => bitrate <= originalBitrate)

    if (originalBitrate > Math.max(...baseBitrates)) {
        targetBitrates.push(originalBitrate)
    }

    for (const bitrate of targetBitrates) {
        const bitrateDir = path.join(outputDir, `${bitrate}k`)
        await fs.mkdir(bitrateDir, {recursive: true})

        await segmentAudio(
            inputPath,
            bitrateDir,
            segmentTime,
            bitrate,
            req,
        )
    }

    let masterContent = '#EXTM3U\n'
    for (const bitrate of targetBitrates) {
        masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bitrate * 1000},CODECS="mp4a.40.2"\n`
        masterContent += `${bitrate}k/playlist.m3u8\n`
    }
    await fs.writeFile(path.join(outputDir, 'master.m3u8'), masterContent)

    return targetBitrates
}