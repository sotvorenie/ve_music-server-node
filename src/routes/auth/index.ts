import { Router, type Request, type Response } from 'express';

import {authBaseSchema} from "@routes/auth/schemas.js";
import {authResponse} from "@routes/auth/responses.js";
import {logIn, register} from "@routes/auth/services/index.js";

import {asyncHandler} from "@utils/asyncHandler.js";
import {getUser} from "@utils/auth.js";

import {nameSchema} from "@schemas/nameSchema.js";

export const authRouter = Router();

authRouter.post('/register', asyncHandler(async (req: Request, res: Response) => {
    const { login, password, name } = authBaseSchema.extend(nameSchema.shape).parse(req.body)

    const newUser = await register(login, password, name)

    return authResponse(res, newUser)
}))

authRouter.post('/login', asyncHandler(async (req: Request, res: Response) => {
    const {login, password} = authBaseSchema.parse(req.body)

    const user = await logIn(login, password)

    return authResponse(res, user)
}))

authRouter.get('/me', getUser(), asyncHandler(async (req: Request, res: Response) => {
    return authResponse(res, req.user!)
}))
