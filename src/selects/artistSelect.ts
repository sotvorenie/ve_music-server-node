export const artistBaseSelect = {
    id: true,
    name: true,
}

export const artistFullSelect = {
    ...artistBaseSelect,
    avatarUrl: true,
}