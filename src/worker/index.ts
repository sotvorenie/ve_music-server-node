import {db} from "@/db.js";

import {sleep} from "@worker/core/sleep.js";
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

    while (true) {
        const music = await takeNextPending()

        if (!music) {
            await sleep(2000)
            continue
        }

        await processingMusic(music)
    }
}

main().then()