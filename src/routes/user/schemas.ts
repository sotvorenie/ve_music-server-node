import {z} from 'zod'
import {UserRole} from "@/generated/prisma/enums.js";

export const roleSchema = z.object({
    role: z.enum(UserRole),
})