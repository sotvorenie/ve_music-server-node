import {z} from "zod";

import {nameSchema} from "@schemas/nameSchema.js";
import {pageLimitSchema} from "@schemas/pageLimitSchema.js";

export const musicSchemaGenreIdAndArtistIdAndName = nameSchema.extend({
    genre_id: z.string().transform(Number),
    artist_id: z.string().transform(Number),
})

export const auditionsCountSchema = z.object({
    auditions_count: z.string().transform(Number),
})

export const getRandomMusicSchema = musicSchemaGenreIdAndArtistIdAndName.extend(pageLimitSchema.shape).extend({
    seed: z.string().transform(Number),
    exclude_id: z.string().transform(Number),
})