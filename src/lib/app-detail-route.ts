/**
 * App detail routing for Next static export (`output: 'export'`).
 *
 * Only `/apps/_/` is pre-rendered. Real project ids must travel in `?id=` so
 * client navigation does not fetch a missing `/apps/<id>/` HTML shell
 * (which surfaces as `TypeError: Load failed` in the Tauri webview).
 */

export const APP_DETAIL_STATIC_SEGMENT = '_'

/** Href that exists in the static export for any project id. */
export function appDetailHref(id: string): string {
    const trimmed = id.trim()
    if (!trimmed) return `/apps/${APP_DETAIL_STATIC_SEGMENT}/`
    return `/apps/${APP_DETAIL_STATIC_SEGMENT}/?id=${encodeURIComponent(trimmed)}`
}

/** Resolve app id from `/apps/:id` and optional `?id=` (query wins). */
export function resolveAppDetailId(pathname: string, search: string): string {
    const fromQuery = new URLSearchParams(search).get('id')?.trim()
    if (fromQuery) return fromQuery

    const normalized = pathname.replace(/\/$/, '')
    const match = normalized.match(/^\/apps\/([^/]+)$/)
    if (!match) return ''
    const id = decodeURIComponent(match[1])
    return id === APP_DETAIL_STATIC_SEGMENT ? '' : id
}

/** @deprecated Prefer resolveAppDetailId(pathname, search). */
export function appIdFromPathname(pathname: string): string {
    return resolveAppDetailId(pathname, '')
}
