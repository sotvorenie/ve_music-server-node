import {nameSchema} from "@schemas/nameSchema.js";
import {z} from "zod";

export const musicSchemaGenreIdAndArtistIdAndName = nameSchema.extend({
    genre_id: z.string().transform(Number),
    artist_id: z.string().transform(Number),
})

export const musicSchemaUrl = z.object({
    url: z.string(),
})