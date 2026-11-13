import {z} from 'zod'
import {UserRole} from "@/generated/prisma/enums.js";

export const roleSchema = z.object({
    role: z.enum(UserRole),
})

export const oldPasswordSchema = z.object({
    old_password: z.string(),
})