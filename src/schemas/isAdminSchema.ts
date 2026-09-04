import {z} from "zod";

export const isAdminSchema = z.object({
    is_admin: z.string().transform(Boolean).default(false),
})