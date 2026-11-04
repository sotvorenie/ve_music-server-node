import path from "node:path";
import fs from "node:fs/promises";

import { BASE_STORAGE_DIR } from "@/config.js";

export const deletePath = async (url: string | undefined) => {
    if (!url) return
    let formattedUrl = url.replace('/static', '').replace('/playlist.m3u8', '')
    const filePath = path.join(BASE_STORAGE_DIR, formattedUrl)

    try {
        await fs.rm(filePath, { recursive: true, force: true })
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            console.log('Не найдено, пропускаем удаление')
        } else {
            console.error('Ошибка при удалении:', err)
        }
    }
}