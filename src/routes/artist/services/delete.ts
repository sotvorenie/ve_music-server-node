import {db} from "@/db.js";
import {deletePath} from "@composables/useDeletePath.js";
import {deleteFromDB} from "@services/deleteService.js";
import {modelMap} from "@services/modelMap.js";

export const deleteArtist = async (
    id: number,
) => {
    const data = await db.artist.findUnique({
        where: {id},
        select: {
            avatarUrl: true
        }
    })

    if (data?.avatarUrl) await deletePath(data.avatarUrl)

    await deleteFromDB(id, modelMap.artist)
}