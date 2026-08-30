import {z} from "zod";

export const avatarUrlSchema = z.object({
    avatarUrl: z.string()
})