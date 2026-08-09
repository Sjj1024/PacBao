'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { applyColorScheme } from '@/lib/theme'
import { selectColorScheme, useThemeStore } from '@/stores/theme-store'

export function ThemeSync() {
    const colorScheme = useThemeStore(selectColorScheme)
    const [hydrated, setHydrated] = useState(false)

    useEffect(() => {
        const persist = useThemeStore.persist
        if (!persist) {
            setHydrated(true)
            return
        }

        const finish = () => setHydrated(true)
        const unsub = persist.onFinishHydration(finish)
        if (persist.hasHydrated()) {
            finish()
        }
        return unsub
    }, [])

    // After localStorage theme is restored, sync DOM + Tauri setTheme.
    useLayoutEffect(() => {
        if (!hydrated) return
        applyColorScheme(colorScheme)
    }, [hydrated, colorScheme])

    return null
}
