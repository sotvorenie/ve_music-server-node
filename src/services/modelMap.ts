import {db} from "@/db.js";

export const modelMap = {
    like: db.like,
    history: db.history,
    artist: db.artist,
    genre: db.genre,
}