import bcrypt from "bcryptjs";
import {db} from "@/db.js";

import {authException} from "@utils/httpExceptions.js";

import {userSelect} from "@selects/userSelect.js";

export const logIn = async (
    login: string,
    password: string,
) => {
    const user = await db.user.findUnique({
        where: {
            login,
        },
        select: {
            ...userSelect,
            password: true,
        },
    })
    if (!user) throw authException

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) throw authException

    const { password: _, ...userWithoutPassword } = user

    return userWithoutPassword
}