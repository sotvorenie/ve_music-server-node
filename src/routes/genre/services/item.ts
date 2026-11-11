import {db} from "@/db.js";

export const getGenre = async (
    id: number,
) => {
    return db.genre.findUnique({
        where: {
            id,
        },
        select: {
            id: true,
            name: true,
        },
    })
}