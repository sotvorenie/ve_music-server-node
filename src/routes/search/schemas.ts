import {z} from "zod";
import {SearchType} from "@/generated/prisma/enums.js";

export const searchSchema = z.object({
    search: z.string()
})

export const typeSchema = z.object({
    type: z.enum(SearchType),
})