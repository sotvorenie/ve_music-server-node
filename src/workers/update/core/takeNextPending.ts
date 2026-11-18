import {db} from "@/db.js";
import type {Music} from "@/generated/prisma/client.js";

export const takeNextPending = async () => {
    const rows = await db.$queryRaw<Music[]>`
        UPDATE musics
        SET status = 'PROCESSING', updated_at = now()
        WHERE id = (
            SELECT id FROM musics
            WHERE status = 'PENDING'
            ORDER BY created_at
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        )
        RETURNING
            *,
            url_with_clip AS "urlWithClip",
            preview_url AS "previewUrl",
            preview_x480_url AS "previewX480Url"
    `

    return rows[0] ?? null
}