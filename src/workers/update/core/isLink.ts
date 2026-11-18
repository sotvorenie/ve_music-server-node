export const isLink = (
    url: string | null,
) => {
    return url?.startsWith('/static') ?? true
}