import {deletePath} from "@composables/useDeletePath.js";

export const deleteAvatar = async (
    id: number,
    model: any,
    emptyException: any,
) => {
    const item = await model.findUnique({
        where: {
            id,
        },
        select: {
            avatarUrl: true,
        },
    })
    if (!item.avatarUrl) throw emptyException

    await model.update({
        where: {
            id,
        },
        data: {
            avatarUrl: '',
        },
    })

    await deletePath(item.avatarUrl)
}