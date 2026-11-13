import path from "node:path";

import {PREVIEWS_DIRECTORY} from "@/config.js";

import {formatPath} from "@composables/useFormatPath.js";
import {createUrl} from "@composables/useCreateUrl.js";

export const findMobilePosterByUrl = (
    posterUrl: string | undefined,
) => {
    if (!posterUrl) return null

    const formattedPath = formatPath(posterUrl)
    const {name} = path.parse(formattedPath)

    return createUrl(path.join(PREVIEWS_DIRECTORY, `${name}_mobile.webp`))
}