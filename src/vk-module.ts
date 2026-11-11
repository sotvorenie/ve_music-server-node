import { VK } from 'vk-io';
import fs from 'fs';
import path from 'path';

const vk = new VK({
    token: process.env.VK_TOKEN as string
})

const downloadPreview = async (url: string, outputPath: string) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Ошибка скачивания обложки: ${response.statusText}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(outputPath, buffer)
}

const clearString = (str: string) => {
    return str.replace(/[/\\?%*:|"<>]/g, '').trim();
}

export const vkLoad = async () => {
    try {
        const response = await vk.api.audio.get({ count: 3 })

        fs.mkdirSync('./downloads/audio', { recursive: true })
        fs.mkdirSync('./downloads/previews', { recursive: true })

        for (const track of response.items) {
            const safeArtist = clearString(track.artist)
            const safeTitle = clearString(track.title)
            const fileName = `${safeArtist} - ${safeTitle}`;

            if (track.url) {
                const mp3Path = path.join('downloads', 'audio', `${fileName}.mp3`)
                await downloadAudio(track.url, mp3Path)
            }

            const previewUrl = track.album?.thumb?.photo_1200 || track.album?.thumb?.photo_600
            if (previewUrl) {
                const previewPath = path.join('downloads', 'previews', `${fileName}.jpg`)
                await downloadPreview(previewUrl, previewPath)
            }
        }
    } catch {}
}

const downloadAudio = async (
    url: string,
    path: string,
) => {

}