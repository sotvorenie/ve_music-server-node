import {Client} from "pg";
import {db} from "@/db.js";

import {processingMusic} from "@worker/core/processingMusic.js";
import {takeNextPending} from "@worker/core/takeNextPending.js";

const main = async () => {
    await db.music.updateMany({
        where: {
            status: 'PROCESSING',
        },
        data: {
            status: 'PENDING',
        },
    })

    const listener = new Client({connectionString: process.env.DATABASE_URL})
    await listener.connect()
    await listener.query('LISTEN music_pending')

    const work = async () => {
        while (true) {
            const music = await takeNextPending()
            if (!music) break
            await processingMusic(music)
        }
    }

    listener.on('notification', () => work().catch(err => console.error(err)))

    await work()
}

main().catch(err => {
    console.error('Worker fatal:', err)
    process.exit(1)
})