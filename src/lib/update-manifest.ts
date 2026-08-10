import type { HomeLocale } from '@/locales/home'

const SHOWN_NOTICE_STORAGE_KEY = 'pakeplus-shown-notice'

/** Locale keys inside the remote notify-upgrade manifest (`shared/desktop.json`). */
export type UpdateManifestLocaleKey = 'zh' | 'zhTw' | 'en' | 'ja' | 'ko'

export type UpdateManifestLocaleBlock = {
    note?: string
    update?: string
    noteLink?: string
}

/**
 * Custom fields from `Update.rawJson` (Tauri updater endpoint JSON).
 * Standard fields (`version`, `platforms`, …) also live on `Update`.
 * Aligns with server `PlatformConfig` / `shared/desktop.json`.
 */
export type UpdateManifestExtras = {
    version?: string
    forceUpdate?: boolean
    showNote?: boolean
    noteRepeat?: boolean
    zh?: UpdateManifestLocaleBlock
    en?: UpdateManifestLocaleBlock
    ja?: UpdateManifestLocaleBlock
    ko?: UpdateManifestLocaleBlock
    zhTw?: UpdateManifestLocaleBlock
}

const LOCALE_TO_MANIFEST: Record<HomeLocale, UpdateManifestLocaleKey> = {
    'zh-CN': 'zh',
    'zh-TW': 'zhTw',
    en: 'en',
    ja: 'ja',
    ko: 'ko',
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function readString(
    record: Record<string, unknown>,
    key: string
): string | undefined {
    const value = record[key]
    return typeof value === 'string' ? value : undefined
}

function readLocaleBlock(
    raw: Record<string, unknown>,
    key: UpdateManifestLocaleKey
): UpdateManifestLocaleBlock | undefined {
    const block = raw[key]
    if (!isRecord(block)) return undefined
    return {
        note: readString(block, 'note'),
        update: readString(block, 'update'),
        noteLink: readString(block, 'noteLink'),
    }
}

/** Parse custom updater fields from `Update.rawJson`. */
export function parseUpdateManifestExtras(
    rawJson: Record<string, unknown>
): UpdateManifestExtras {
    return {
        version: readString(rawJson, 'version'),
        forceUpdate: rawJson.forceUpdate === true,
        showNote: rawJson.showNote === true,
        // Default true: show again each launch unless explicitly false.
        noteRepeat: rawJson.noteRepeat !== false,
        zh: readLocaleBlock(rawJson, 'zh'),
        en: readLocaleBlock(rawJson, 'en'),
        ja: readLocaleBlock(rawJson, 'ja'),
        ko: readLocaleBlock(rawJson, 'ko'),
        zhTw: readLocaleBlock(rawJson, 'zhTw'),
    }
}

/** True when `remote` is a newer semver-like version than `current`. */
export function isVersionNewer(remote: string, current: string): boolean {
    const parse = (v: string) =>
        v
            .trim()
            .replace(/^[vV]/, '')
            .split(/[.+-]/)
            .map((part) => {
                const n = Number.parseInt(part, 10)
                return Number.isFinite(n) ? n : 0
            })

    const a = parse(remote)
    const b = parse(current)
    const len = Math.max(a.length, b.length)
    for (let i = 0; i < len; i++) {
        const x = a[i] ?? 0
        const y = b[i] ?? 0
        if (x > y) return true
        if (x < y) return false
    }
    return false
}

function localeField(
    extras: UpdateManifestExtras,
    locale: HomeLocale,
    field: 'note' | 'update' | 'noteLink'
): string {
    const key = LOCALE_TO_MANIFEST[locale]
    const primary = extras[key]?.[field]?.trim()
    if (primary) return primary
    const en = extras.en?.[field]?.trim()
    if (en) return en
    const zh = extras.zh?.[field]?.trim()
    if (zh) return zh
    return ''
}

/** Localized update tips (`update`); falls back to en → zh → empty. */
export function getUpdateTips(
    extras: UpdateManifestExtras,
    locale: HomeLocale
): string {
    return localeField(extras, locale, 'update')
}

/** Localized notice body (`note`); falls back to en → zh → empty. */
export function getNoticeNote(
    extras: UpdateManifestExtras,
    locale: HomeLocale
): string {
    return localeField(extras, locale, 'note')
}

/** Localized notice link (`noteLink`); falls back to en → zh → empty. */
export function getNoticeLink(
    extras: UpdateManifestExtras,
    locale: HomeLocale
): string {
    return localeField(extras, locale, 'noteLink')
}

/** Identity for a notice so `noteRepeat: false` can skip re-showing. */
export function getNoticeFingerprint(
    extras: UpdateManifestExtras,
    note: string
): string {
    return `${extras.version ?? ''}|${note}`
}

export function hasShownNotice(fingerprint: string): boolean {
    if (typeof window === 'undefined' || !fingerprint) return false
    try {
        return window.localStorage.getItem(SHOWN_NOTICE_STORAGE_KEY) === fingerprint
    } catch {
        return false
    }
}

export function markNoticeShown(fingerprint: string): void {
    if (typeof window === 'undefined' || !fingerprint) return
    try {
        window.localStorage.setItem(SHOWN_NOTICE_STORAGE_KEY, fingerprint)
    } catch {
        /* ignore quota / private mode */
    }
}
