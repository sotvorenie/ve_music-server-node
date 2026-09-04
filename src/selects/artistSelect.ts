export const artistBaseSelect = {
    id: true,
    name: true,
}

export const artistFullSelect = {
    ...artistBaseSelect,
    avatarUrl: true,
}

export const artistAdminSelect = {
    ...artistFullSelect,
    createdAt: true,
    updatedAt: true,
}