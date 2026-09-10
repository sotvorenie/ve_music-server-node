import {z} from "zod";

export const pathSchema = z.object({
    path: z.string()
})