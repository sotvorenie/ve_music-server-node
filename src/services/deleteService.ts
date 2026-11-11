export const deleteFromDB = async (
    id: number,
    model: any,
) => {
    await model.delete({
        where: {
            id
        }
    })
}