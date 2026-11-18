import {Client} from "pg";
import {db} from "@/db.js";

import {deleteData} from "@/workers/delete/core/deleteData.js";

const main = async () => {
    const listener = new Client({connectionString: process.env.DATABASE_URL})
    await listener.connect()
    await listener.query('LISTEN delete_pending')

    let isWorking = false

    const work = async () => {
        if (isWorking) return
        isWorking = true

        try {
            while (true) {
                const music = await db.music.findFirst({
                    where: {
                        status: 'FAILED',
                    },
                    select: {
                        id: true,
                    },
                })
                if (!music) break
                await deleteData(music.id)
            }
        } finally {
            isWorking = false
        }
    }

    listener.on('notification', () => work().catch(err =>  console.error(err)))

    await work()
}

main().catch(err => {
    console.error('delete-worker fatal:', err)
    process.exit(1)
})