import {db} from "@/db.js";

import {getSkip} from "@composables/useGetSkip.js";

import {modelMap} from "@services/modelMap.js";
import {musicAdminSelect} from "@selects/musicSelect.js";

export const getAllMusic = async (
    id: number,
    page: number,
    limit: number,
    model: any,
) => {
    const skip = getSkip(page, limit)

    let where
    if (model === modelMap.artist) {
        where = {
            artists: {
                some: {
                    id
                }
            }
        }
    } else if (model === modelMap.genre) {
        where = {
            genreId: id
        }
    } else {
        throw new Error('Нет необходимой модели..')
    }

    return db.music.findMany({
        where,
        select: musicAdminSelect,
        skip,
        take: limit,
    })
}