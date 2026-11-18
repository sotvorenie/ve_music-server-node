export const updateNameInDB = async (
    id: number,
    name: string,
    model: any,
) => {
    await model.update({
        where: {
            id,
        },
        data: {
            name,
        },
    })
}