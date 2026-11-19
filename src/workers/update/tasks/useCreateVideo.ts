import fs from "node:fs/promises";
import path from "node:path";

import {runFfmpeg} from "@/workers/update/tasks/useRunFfmpeg.js";

import {getVideoInfo} from "@composables/useGetVideoInfo.js";
import {getMasterPath} from "@composables/useGetMasterPath.js";

const codecStringFor = (height: number): string =>
    height >= 2160 ? 'avc1.4d4033' :
        height >= 1440 ? 'avc1.4d4032' :
            height >= 1080 ? 'avc1.4d4029' : 'avc1.4d401f'

const segmentVideo = async (
    inputPath: string,
    outputDir: string,
    segmentTime: number,
    height: number,
    audioDuration: number,
): Promise<void> => {
    const gop = segmentTime * 2

    const level =
        height >= 2160 ? '5.1' :
            height >= 1440 ? '5.0' :
                height >= 1080 ? '4.1' : '3.1'

    const args = [
        '-i', inputPath,
        '-t', String(audioDuration),
        '-map', '0:v:0',
        '-vf', `scale=-2:${height}:flags=lanczos`,
        '-c:v', 'libx264',
        '-profile:v', 'main',
        '-level', level,
        '-preset', 'veryfast',
        '-crf', '21',
        '-pix_fmt', 'yuv420p',
        '-g', String(gop),
        '-keyint_min', String(gop),
        '-sc_threshold', '0',
        '-force_key_frames', `expr:gte(t,n_forced*${segmentTime})`,
        '-an',
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

const createAudioWithClipMaster = async (
    audioId: number,
    videoMaster: string,
) => {
    const withClipMasterPath = getMasterPath(audioId, 'video')

    const audioMaster = getMasterPath(audioId, 'audio')
    let masterContent = await fs.readFile(audioMaster, 'utf-8')

    if (!masterContent.endsWith('\n')) masterContent += '\n'

    masterContent += videoMaster

    await fs.writeFile(withClipMasterPath, masterContent, 'utf-8')
}

export const createVideo = async (
    inputPath: string,
    outputDir: string,
    segmentTime: number,
    audio: {
        id: number,
        duration: number,
    },
): Promise<void> => {
    const height = await getVideoInfo(inputPath, 'height')
    const fps = await getVideoInfo(inputPath, 'fps')

    await fs.mkdir(outputDir, {recursive: true})

    await segmentVideo(
        inputPath,
        outputDir,
        segmentTime,
        height,
        audio.duration,
    )

    const width = Math.round(height * 16 / 9)
    const bandwidth = Math.round(height * width * 0.08 * fps * 1.3)

    const audioMaster = getMasterPath(audio.id, 'audio')
    const playlistPath = path.relative(
        path.dirname(audioMaster),
        path.join(outputDir, 'playlist.m3u8')
    ).replaceAll(path.sep, '/')

    const masterContent: string = [
        '#EXTM3U',
        '#EXT-X-VERSION:7',
        '#EXT-X-INDEPENDENT-SEGMENTS',
        `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height},CODECS="${codecStringFor(height)},mp4a.40.2",AUDIO="aud"`,
        playlistPath
    ].join('\n') + '\n'

    await createAudioWithClipMaster(audio.id, masterContent)
}