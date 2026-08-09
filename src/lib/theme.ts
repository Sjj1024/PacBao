import type { ColorScheme } from '@/stores/theme-store'
import { isTauri } from '@tauri-apps/api/core'

/** Apply theme on <html>; uses `only` so OS dark mode does not override app choice. */
export function applyColorScheme(scheme: ColorScheme) {
    const root = document.documentElement
    const isDark = scheme === 'dark'
    root.classList.toggle('dark', isDark)
    root.dataset.theme = scheme
    root.style.colorScheme = isDark ? 'dark only' : 'light only'
    void syncTauriWindowTheme(scheme)
}

/** Keep native window / titlebar theme in sync with the web UI. */
async function syncTauriWindowTheme(scheme: ColorScheme) {
    if (!isTauri()) return
    try {
        const { setTheme } = await import('@tauri-apps/api/app')
        await setTheme(scheme)
    } catch {
        // Ignore when the API is unavailable or permission is missing.
    }
}
