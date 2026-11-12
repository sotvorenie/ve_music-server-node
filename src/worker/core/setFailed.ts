import {db} from "@/db.js";

export const setFailed = async (
    id: number,
) => {
    return db.music.update({
        where: {
            id,
        },
        data: {
            status: "FAILED",
        },
    })
}