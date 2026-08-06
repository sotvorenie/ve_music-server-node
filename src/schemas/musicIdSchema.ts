import {z} from "zod";

export const musicIdSchema = z.object({
    music_id: z.string().transform(Number)
})