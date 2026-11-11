import {db} from "@/db.js";

export const getGenres = async (
    isAdmin: boolean,
) => {
    return db.genre.findMany({
        select: {
            id: true,
            name: true,
            ...(isAdmin && {
                createdAt: true,
                updatedAt: true,
            })
        }
    })
}