// получаем значение для вывода hasMore

export const getHasMore = (skip: number, limit: number, total: number) => {
    return (skip + limit) < total
}