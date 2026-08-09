import { isTauri } from '@tauri-apps/api/core'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { resolvePackIconPath } from '@/lib/pack-api'

const PREVIEW_LABEL = 'preview'

export type PreviewWindowOptions = {
    title: string
    url: string
    width: number
    height: number
    icon?: string
    userAgent?: string
}

function isHttpUrl(value: string) {
    try {
        const parsed = new URL(value)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

/**
 * Open (or recreate) a Tauri WebviewWindow that loads the configured site.
 * userAgent is only applied when non-empty; icon is applied after create.
 */
export async function openPreviewWindow(
    options: PreviewWindowOptions,
): Promise<void> {
    if (!isTauri()) return

    const url = options.url.trim()
    if (!url || !isHttpUrl(url)) {
        throw new Error('invalid preview url')
    }

    const title = options.title.trim() || 'Preview'
    const width =
        Number.isFinite(options.width) && options.width > 0
            ? Math.round(options.width)
            : 1200
    const height =
        Number.isFinite(options.height) && options.height > 0
            ? Math.round(options.height)
            : 800
    const userAgent = options.userAgent?.trim() || undefined

    const existing = await WebviewWindow.getByLabel(PREVIEW_LABEL)
    if (existing) {
        await existing.close()
    }

    const iconPath = options.icon?.trim()
        ? await resolvePackIconPath(options.icon).catch(() => null)
        : null

    const preview = new WebviewWindow(PREVIEW_LABEL, {
        url,
        title,
        width,
        height,
        center: true,
        focus: true,
        ...(userAgent ? { userAgent } : {}),
    })

    await new Promise<void>((resolve, reject) => {
        const onCreated = () => {
            void (async () => {
                try {
                    if (iconPath) {
                        await preview.setIcon(iconPath)
                    }
                    resolve()
                } catch (err) {
                    // Window is usable even if icon fails.
                    console.warn('preview setIcon failed', err)
                    resolve()
                }
            })()
        }
        const onError = (event: { payload: unknown }) => {
            reject(
                new Error(
                    typeof event.payload === 'string'
                        ? event.payload
                        : 'failed to create preview window',
                ),
            )
        }
        void preview.once('tauri://created', onCreated)
        void preview.once('tauri://error', onError)
    })
}
