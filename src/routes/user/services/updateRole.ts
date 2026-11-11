import {db} from "@/db.js";
import type {UserRole} from "@/generated/prisma/enums.js";

export const updateUserRole = async (
    id: number,
    role: UserRole,
) => {
    await db.user.update({
        where: {
            id,
        },
        data: {
            role,
        },
    })
}