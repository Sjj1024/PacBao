import type { AuthUser } from '@/lib/auth-types'

export const AUTH_TOKEN_STORAGE_KEY = 'packager-auth-token'
export const AUTH_USER_STORAGE_KEY = 'packager-auth-user'
export const AUTH_SESSION_CHANGE_EVENT = 'packager-auth-session-change'

function notifyAuthSessionChange() {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT))
}

export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    try {
        const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
        return token?.trim() ? token : null
    } catch {
        return null
    }
}

export function getAuthUser(): AuthUser | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY)
        if (raw) return JSON.parse(raw) as AuthUser
    } catch {
        /* ignore */
    }
    return null
}

export function hasAuthToken(): boolean {
    return Boolean(getAuthToken())
}

export function setAuthToken(token: string) {
    if (typeof window === 'undefined') return
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export function setAuthSession(session: { token: string; user: AuthUser }) {
    setAuthToken(session.token)
    if (typeof window === 'undefined') return
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user))
    notifyAuthSessionChange()
}

export function clearAuthToken() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export function clearAuthSession() {
    clearAuthToken()
    if (typeof window === 'undefined') return
    localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    notifyAuthSessionChange()
}
