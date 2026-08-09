'use client'

import { create } from 'zustand'
import {
    createJSONStorage,
    persist,
    type StateStorage,
} from 'zustand/middleware'
import {
    HOME_LOCALE_STORAGE_KEY,
    type HomeLocale,
    isHomeLocale,
} from '@/locales/home'

const PERSIST_KEY = 'pakeplus-locale'

type LocaleState = {
    locale: HomeLocale
    setLocale: (locale: HomeLocale) => void
}

/** Stable selectors: inline (s) => s.x breaks useSyncExternalStore in React 19. */
export const selectLocale = (s: LocaleState) => s.locale
export const selectSetLocale = (s: LocaleState) => s.setLocale

const localeStorage: StateStorage = {
    getItem: (name) => {
        if (typeof window === 'undefined') return null
        try {
            const row = window.localStorage.getItem(name)
            if (row) return row
            if (name === PERSIST_KEY) {
                const legacy = window.localStorage.getItem(
                    HOME_LOCALE_STORAGE_KEY
                )
                if (legacy && isHomeLocale(legacy)) {
                    return JSON.stringify({
                        state: { locale: legacy },
                        version: 0,
                    })
                }
            }
        } catch {
            /* ignore */
        }
        return null
    },
    setItem: (name, value) => {
        window.localStorage.setItem(name, value)
    },
    removeItem: (name) => {
        window.localStorage.removeItem(name)
    },
}

export const useLocaleStore = create<LocaleState>()(
    persist(
        (set) => ({
            locale: 'zh-CN',
            setLocale: (locale) => set({ locale }),
        }),
        {
            name: PERSIST_KEY,
            storage: createJSONStorage(() => localeStorage),
            partialize: (s) => ({ locale: s.locale }),
            version: 0,
        }
    )
)
