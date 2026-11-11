import path from "path";

import {BACKUP_PREVIEWS_DIRECTORY} from "@/config.js";

import {safeReaddir} from "@composables/useSafeReaddir.js";
import {createUrl} from "@composables/useCreateUrl.js";

export const getBackupPreview = async (): Promise<string> => {
    const backupPreviews = await safeReaddir(BACKUP_PREVIEWS_DIRECTORY)
    const backupPreview = backupPreviews[Math.floor(Math.random() * backupPreviews.length)]

    if (!backupPreview) return ''

    const previewPath = path.join(backupPreview.parentPath, backupPreview.name)
    return createUrl(previewPath)
}