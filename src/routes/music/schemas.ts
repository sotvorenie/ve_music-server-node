import {z} from "zod";

import {nameSchema} from "@schemas/nameSchema.js";

export const musicSchemaGenreIdAndArtistIdAndName = nameSchema.extend({
    genre_id: z.string().transform(Number),
    artist_id: z.string().transform(Number),
})