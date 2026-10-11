import path from "path";

import {MUSIC_DIRECTORY} from "@/config.js";

import {safeReaddir} from "@composables/useSafeReaddir.js";
import {createUrl} from "@composables/useCreateUrl.js";

export const getBackupPreview = async (): Promise<string> => {
    const backupPreviewsPath = path.join(MUSIC_DIRECTORY, 'backup_previews')
    const backupPreviews = await safeReaddir(backupPreviewsPath)
    const backupPreview = backupPreviews[Math.floor(Math.random() * backupPreviews.length)]

    if (!backupPreview) return ''

    const previewPath = path.join(backupPreview.parentPath, backupPreview.name)
    return createUrl(previewPath)
}