import {z} from "zod";

export const musicInfoSchema = z.object({
    title: z.string().min(1),
    genre_id: z.string().transform(Number),
    artists: z.string().optional().transform(val => {
        if (!val) return []
        return val.split(',')
            .map(t => Number(t.trim()))
            .filter(n => !isNaN(n))
    })
})