'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ColorScheme = 'light' | 'dark'

const PERSIST_KEY = 'pakeplus-theme'

type ThemeState = {
    colorScheme: ColorScheme
    setColorScheme: (scheme: ColorScheme) => void
    toggleColorScheme: () => void
}

export const selectColorScheme = (s: ThemeState) => s.colorScheme
export const selectToggleColorScheme = (s: ThemeState) => s.toggleColorScheme

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            colorScheme: 'dark',
            setColorScheme: (colorScheme) => set({ colorScheme }),
            toggleColorScheme: () =>
                set({
                    colorScheme:
                        get().colorScheme === 'dark' ? 'light' : 'dark',
                }),
        }),
        {
            name: PERSIST_KEY,
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({ colorScheme: s.colorScheme }),
            version: 0,
        }
    )
)

export const THEME_STORAGE_KEY = PERSIST_KEY

/** beforeInteractive — matches zustand persist `{ state: { colorScheme } }`. */
export const THEME_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(PERSIST_KEY)};var raw=localStorage.getItem(k);var scheme="dark";if(raw){var j=JSON.parse(raw);if(j&&j.state&&(j.state.colorScheme==="light"||j.state.colorScheme==="dark"))scheme=j.state.colorScheme;}var r=document.documentElement;var d=scheme==="dark";r.classList.toggle("dark",d);r.dataset.theme=scheme;r.style.colorScheme=d?"dark only":"light only";}catch(e){}})();`
