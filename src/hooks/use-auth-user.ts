'use client'

import { useEffect, useState } from 'react'
import { fetchCurrentUser } from '@/lib/auth-api'
import type { AuthUser } from '@/lib/auth-types'
import {
    AUTH_SESSION_CHANGE_EVENT,
    clearAuthSession,
    getAuthToken,
    getAuthUser,
    setAuthSession,
} from '@/lib/auth-token'

type AuthSession = {
    user: AuthUser | null
    ready: boolean
}

/** Current signed-in user; validates Bearer token via GET /me when present. */
export function useAuthUser(): AuthSession {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function hydrateFromServer() {
            const token = getAuthToken()
            if (!token) {
                if (!cancelled) {
                    setUser(null)
                    setReady(true)
                }
                return
            }

            try {
                const remote = await fetchCurrentUser(token)
                if (cancelled) return
                setAuthSession({ token, user: remote })
                setUser(remote)
            } catch {
                if (cancelled) return
                clearAuthSession()
                setUser(null)
            } finally {
                if (!cancelled) setReady(true)
            }
        }

        function syncFromStorage() {
            setUser(getAuthUser())
        }

        void hydrateFromServer()
        window.addEventListener(AUTH_SESSION_CHANGE_EVENT, syncFromStorage)
        window.addEventListener('storage', syncFromStorage)
        return () => {
            cancelled = true
            window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, syncFromStorage)
            window.removeEventListener('storage', syncFromStorage)
        }
    }, [])

    return { user, ready }
}
