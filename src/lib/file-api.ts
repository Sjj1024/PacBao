import { convertFileSrc, invoke, isTauri } from '@tauri-apps/api/core'
import type { FileErrorBody, UploadFileResponse } from '@/lib/file-types'

export class FileApiError extends Error {
    code?: number

    constructor(message: string, code?: number) {
        super(message)
        this.name = 'FileApiError'
        this.code = code
    }
}

export function isDataUrl(value: string): boolean {
    return value.startsWith('data:')
}

export function isFilesystemIconPath(value: string): boolean {
    const v = value.trim()
    if (!v || isDataUrl(v) || v.startsWith('blob:') || v.startsWith('http')) {
        return false
    }
    return (
        v.startsWith('file://') ||
        v.startsWith('/') ||
        /^[a-zA-Z]:[\\/]/.test(v)
    )
}

/** Convert a stored icon value into an `<img src>` URL. */
export function toIconSrc(icon: string): string {
    const value = icon.trim()
    if (!value) return ''
    if (
        isDataUrl(value) ||
        value.startsWith('blob:') ||
        value.startsWith('http://') ||
        value.startsWith('https://')
    ) {
        return value
    }
    if (!isTauri()) return value
    try {
        const path = value.startsWith('file://')
            ? decodeURIComponent(value.replace(/^file:\/\//, ''))
            : value
        return convertFileSrc(path)
    } catch {
        return value
    }
}

export async function dataUrlToFile(
    dataUrl: string,
    filename = 'icon.png',
): Promise<File> {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const type = blob.type || 'image/png'
    return new File([blob], filename, { type })
}

/** UI-only stub outside Tauri: object URL. In Tauri unused for icons. */
export async function uploadFile(
    file: File,
    _folder: string,
): Promise<UploadFileResponse> {
    await Promise.resolve()
    const url = URL.createObjectURL(file)
    return {
        success: true,
        key: file.name,
        url,
    }
}

/**
 * Persist icon for project storage.
 * Data URLs are written under app data `project-icons/` and replaced with a file path
 * so localStorage only keeps a short path string.
 */
export async function resolveIconUrl(
    icon: string,
    folder: string,
): Promise<string> {
    if (!icon) return ''
    if (!isDataUrl(icon)) return icon
    if (!isTauri()) {
        // Browser / non-desktop: keep data URL (localStorage quota still applies).
        return icon
    }
    try {
        return await invoke<string>('save_project_icon', {
            dataUrl: icon,
            folder: folder || null,
        })
    } catch (err) {
        const message =
            err instanceof Error
                ? err.message
                : typeof err === 'string'
                  ? err
                  : 'failed to save icon'
        throw new FileApiError(message)
    }
}

/**
 * Write icon + source to disk when they are data URLs.
 * Deduplicates when both values are the same string.
 */
export async function resolveIconPair(
    icon: string,
    iconSource: string,
    folder: string,
): Promise<{ icon: string; iconSource: string }> {
    const nextIcon = await resolveIconUrl(icon, folder)
    if (!iconSource) {
        return { icon: nextIcon, iconSource: '' }
    }
    if (iconSource === icon) {
        return { icon: nextIcon, iconSource: nextIcon }
    }
    const nextSource = await resolveIconUrl(iconSource, `${folder}/source`)
    return { icon: nextIcon, iconSource: nextSource }
}

export type { FileErrorBody }
