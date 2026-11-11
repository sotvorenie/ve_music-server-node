export const createGenre = async (
    name: string,
    model: any,
) => {
    return model.create({
        data: {
            name,
        },
        select: {
            id: true,
            name: true,
        },
    })
}