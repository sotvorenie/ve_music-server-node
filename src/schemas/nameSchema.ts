import {z} from "zod";

export const nameSchema = z.object({
    name: z.string(),
})

export const nameOptionalSchema = z.object({
    name: z.string().optional(),
})