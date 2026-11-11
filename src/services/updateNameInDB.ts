export const updateNameInDB = async (
    id: number,
    name: string | undefined,
    model: any,
) => {
    await model.update({
        where: {
            id
        },
        data: {
            name,
        }
    })
}