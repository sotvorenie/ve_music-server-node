interface BasePeople {
    id: number
    name: string
    login: string
    password: string
}

export interface User extends BasePeople{
    avatarUrl?: string | null
}

declare global {
    namespace Express {
        interface Request {
            user?: User
            admin?: BasePeople
        }
    }
}