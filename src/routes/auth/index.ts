import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import {db} from "@/db.js";

import {authBaseSchema} from "@routes/auth/schemas.js";
import {authResponse} from "@routes/auth/responses.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {registrationException, authException, emptyUserDataException} from "@utils/httpExceptions.js";
import {getUser} from "@utils/auth.js";

import {nameSchema} from "@schemas/nameSchema.js";

export const authRouter = Router();

const registerBodySchema = authBaseSchema.extend(nameSchema.shape)
authRouter.post('/register', asyncHandler(async (req: Request, res: Response) => {
    const { login, password, name } = registerBodySchema.parse(req.body)

    if (!name) throw emptyUserDataException

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

    const newUser = await db.user.create({
        data: {
            login,
            name: name.trim(),
            password: hashedPassword,
        }
    })

    return authResponse(res, newUser)
}))

authRouter.post('/login', asyncHandler(async (req: Request, res: Response) => {
    const { login, password} = authBaseSchema.parse(req.body)

    const user = await db.user.findUnique({
        where: {login},
        select: {
            id: true,
            login: true,
            password: true,
            name: true,
            avatarUrl: true,
            role: true,
        }
    })
    if (!user) throw authException

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) throw authException

    return authResponse(res, user)
}))

authRouter.get('/me', getUser(), asyncHandler(async (req: Request, res: Response) => {
    return authResponse(res, req.user!)
}))
