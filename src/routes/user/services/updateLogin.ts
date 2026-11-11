import {db} from "@/db.js";

import {duplicationLoginException, emptyUserDataException} from "@utils/httpExceptions.js";

export const updateUserLogin = async (
    id: number,
    login: string,
) => {
    const formattedLogin = login?.trim()
    if (!formattedLogin) throw emptyUserDataException

    const userWithLogin = await db.user.findUnique({
        where: {
            login
        },
        select: {
            id: true,
        },
    })

    if (userWithLogin) throw duplicationLoginException

    await db.user.update({
        where: {
            id,
        },
        data: {
            login: formattedLogin,
        },
    })
}