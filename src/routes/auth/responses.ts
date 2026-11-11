import type {Response} from "express";

import {createJWTToken} from "@utils/auth.js";

export const authResponse = (
    res: Response,
    user: { id: number; password?: string; [key: string]: any },
) => {
    const {password, ...userWithoutPassword} = user

    return res.status(201).jsonp({
        user: userWithoutPassword,
        token: createJWTToken(user.id),
    })
}