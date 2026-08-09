import { isTauri } from '@tauri-apps/api/core'

/** Open external URLs in the system browser on desktop; new tab on web. */
export async function openExternal(url: string): Promise<void> {
    if (!url) return

    if (isTauri()) {
        const { openUrl } = await import('@tauri-apps/plugin-opener')
        await openUrl(url)
        return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
}
