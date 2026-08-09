import type {
    AuthSuccessResponse,
    AuthUser,
    RegisteredCheckResponse,
} from '@/lib/auth-types'

export class AuthApiError extends Error {
    code?: number

    constructor(message: string, code?: number) {
        super(message)
        this.name = 'AuthApiError'
        this.code = code
    }
}

export function getApiBaseUrl(): string {
    const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim()
    if (fromEnv) return fromEnv.replace(/\/$/, '')
    return 'http://127.0.0.1:8787'
}

type Envelope<T> = {
    data?: T
    error?: string
    message?: string
    code?: number
}

async function authFetch<T>(
    path: string,
    init?: RequestInit,
): Promise<T> {
    const url = `${getApiBaseUrl()}${path}`
    let res: Response
    try {
        res = await fetch(url, {
            ...init,
            headers: {
                'content-type': 'application/json',
                ...(init?.headers || {}),
            },
        })
    } catch {
        throw new AuthApiError('无法连接认证服务，请确认后端已启动。')
    }

    const body = (await res.json().catch(() => ({}))) as Envelope<T>
    if (!res.ok) {
        throw new AuthApiError(
            body.message || body.error || `请求失败（${res.status}）`,
            body.code ?? res.status,
        )
    }
    if (body.data === undefined) {
        throw new AuthApiError('响应格式无效')
    }
    return body.data
}

function normalizeUser(user: AuthUser): AuthUser {
    return {
        ...user,
        nickname: user.nickname || user.name || user.email,
        avatar: user.avatar ?? null,
        points: user.points ?? 0,
    }
}

export async function login(params: {
    email?: string
    name?: string
    password: string
}): Promise<AuthSuccessResponse> {
    const email = (params.email ?? params.name ?? '').trim()
    const data = await authFetch<AuthSuccessResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email,
            password: params.password,
        }),
    })
    return {
        token: data.token,
        user: normalizeUser(data.user),
        gitToken: data.gitToken,
    }
}

export async function register(params: {
    email: string
    password: string
    area?: string
}): Promise<AuthSuccessResponse> {
    const data = await authFetch<AuthSuccessResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            email: params.email.trim(),
            password: params.password,
        }),
    })
    return {
        token: data.token,
        user: normalizeUser(data.user),
        gitToken: data.gitToken,
    }
}

export async function checkRegistered(params: {
    email?: string
    name?: string
}): Promise<RegisteredCheckResponse> {
    const email = (params.email ?? params.name ?? '').trim()
    const q = encodeURIComponent(email)
    return authFetch<RegisteredCheckResponse>(`/auth/registered?email=${q}`)
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
    const user = await authFetch<AuthUser>('/me', {
        headers: { Authorization: `Bearer ${token}` },
    })
    return normalizeUser(user)
}

export function getOAuthStartUrl(provider: 'google' | 'github'): string {
    return `${getApiBaseUrl()}/auth/oauth/${provider}`
}
