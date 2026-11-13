import bcrypt from "bcryptjs";
import {db} from "@/db.js";

import {registrationException} from "@utils/httpExceptions.js";

export const register = async (
    login: string,
    password: string,
    name: string,
) => {
    const existingUser = await db.user.findUnique({
        where: {
            login,
        },
        select: {
            id: true,
        },
    })
    if (existingUser) throw registrationException

    const hashedPassword = await bcrypt.hash(password, 10)

    return db.user.create({
        data: {
            login,
            name: name.trim(),
            password: hashedPassword,
        },
    })
}