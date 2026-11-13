import path from "node:path";

import {BASE_STORAGE_DIR} from "@/config.js";

export const formatPath = (
    url: string,
) => {
    const formattedUrl = url
        .replace('/static/', '')
        .replace(/\//g, '\\')

    return path.join(BASE_STORAGE_DIR, formattedUrl)
}