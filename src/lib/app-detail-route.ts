/** Resolve app id from `/apps/:id` (static-export placeholder `_` is ignored). */
export function appIdFromPathname(pathname: string): string {
    const normalized = pathname.replace(/\/$/, '')
    const match = normalized.match(/^\/apps\/([^/]+)$/)
    if (!match) return ''
    const id = decodeURIComponent(match[1])
    return id === '_' ? '' : id
}
