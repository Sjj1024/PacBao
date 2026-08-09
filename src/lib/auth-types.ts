export type AuthUser = {
    id: number | string
    email: string
    role: string
    nickname: string
    status?: string | number
    name?: string
    avatar: string | null
    points: number
    created_at?: string
}

export type AuthSuccessResponse = {
    token: string
    user: AuthUser
    gitToken?: unknown[]
}

export type AuthErrorBody = {
    error?: string
    message?: string
    code?: number
}

export type RegisteredCheckResponse = {
    registered: boolean
}

export function getAuthDisplayName(user: AuthUser): string {
    return user.nickname || user.name || user.email
}
