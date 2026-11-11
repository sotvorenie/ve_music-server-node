import {db} from "@/db.js";

import {deletePath} from "@composables/useDeletePath.js";

export const deleteUser = async (
    id: number,
) => {
    const data = await db.user.findUnique({
        where: {id},
        select: {avatarUrl: true},
    })

    if (data?.avatarUrl) await deletePath(data.avatarUrl)

    await db.user.delete({
        where: {
            id,
        },
    })
}