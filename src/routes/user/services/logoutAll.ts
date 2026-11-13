import {db} from "@/db.js";

export const logoutAll = async (
    id: number,
) => {
    return db.user.update({
        where: {
            id,
        },
        data: {
            tokenVersion: {increment: 1},
        },
    })
}