import { invoke, isTauri } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type { AppProject } from '@/lib/project-types'

export type PackAndroidResult = {
    outputPath: string
    fileName: string
    packageName: string
    sizeBytes: number
}

export type PackMacosResult = {
    outputPath: string
    fileName: string
    packageName: string
    sizeBytes: number
}

export type PackIosResult = {
    outputPath: string
    fileName: string
    packageName: string
    sizeBytes: number
}

export type PackWindowsResult = {
    outputPath: string
    fileName: string
    packageName: string
    sizeBytes: number
}

export type PackWebclipResult = {
    outputPath: string
    fileName: string
    packageName: string
    sizeBytes: number
}

export type PackProgress = {
    message: string
    percent: number
}

export class PackApiError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'PackApiError'
    }
}

async function blobOrUrlToDataUrl(value: string): Promise<string> {
    if (value.startsWith('data:')) return value
    const res = await fetch(value)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            if (typeof reader.result === 'string') resolve(reader.result)
            else reject(new Error('failed to read icon'))
        }
        reader.onerror = () => reject(new Error('failed to read icon'))
        reader.readAsDataURL(blob)
    })
}

/**
 * Turn a UI icon (data URL / blob URL / file path) into a filesystem path
 * that Rust packers can open.
 */
export async function resolvePackIconPath(
    icon: string,
): Promise<string | null> {
    const value = icon.trim()
    if (!value) return null

    if (value.startsWith('file://')) {
        try {
            return decodeURIComponent(value.replace(/^file:\/\//, ''))
        } catch {
            return value.replace(/^file:\/\//, '')
        }
    }
    if (/^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('/')) {
        return value
    }

    if (!isTauri()) return null

    if (
        value.startsWith('data:') ||
        value.startsWith('blob:') ||
        value.startsWith('http://') ||
        value.startsWith('https://')
    ) {
        try {
            const dataUrl = await blobOrUrlToDataUrl(value)
            return await invoke<string>('write_temp_icon', { dataUrl })
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : typeof err === 'string'
                      ? err
                      : 'failed to prepare icon'
            throw new PackApiError(message)
        }
    }

    return null
}

export async function packAndroid(
    project: AppProject
): Promise<PackAndroidResult> {
    if (!isTauri()) {
        throw new PackApiError(
            'APK packaging requires the Tauri desktop app (npm run tauri:dev).'
        )
    }

    try {
        const iconPath =
            (await resolvePackIconPath(project.iconPath ?? '')) ?? null
        return await invoke<PackAndroidResult>('pack_android', {
            project: { ...project, iconPath },
        })
    } catch (err) {
        if (err instanceof PackApiError) throw err
        const message =
            err instanceof Error
                ? err.message
                : typeof err === 'string'
                  ? err
                  : 'Pack failed'
        throw new PackApiError(message)
    }
}

export async function packMacos(
    project: AppProject
): Promise<PackMacosResult> {
    if (!isTauri()) {
        throw new PackApiError(
            'macOS packaging requires the Tauri desktop app (npm run tauri:dev).'
        )
    }

    try {
        const iconPath =
            (await resolvePackIconPath(project.iconPath ?? '')) ?? null
        return await invoke<PackMacosResult>('pack_macos', {
            project: { ...project, iconPath },
        })
    } catch (err) {
        if (err instanceof PackApiError) throw err
        const message =
            err instanceof Error
                ? err.message
                : typeof err === 'string'
                  ? err
                  : 'Pack failed'
        throw new PackApiError(message)
    }
}

export async function packIos(project: AppProject): Promise<PackIosResult> {
    if (!isTauri()) {
        throw new PackApiError(
            'IPA packaging requires the Tauri desktop app (npm run tauri:dev).'
        )
    }

    try {
        const iconPath =
            (await resolvePackIconPath(project.iconPath ?? '')) ?? null
        return await invoke<PackIosResult>('pack_ios', {
            project: { ...project, iconPath },
        })
    } catch (err) {
        if (err instanceof PackApiError) throw err
        const message =
            err instanceof Error
                ? err.message
                : typeof err === 'string'
                  ? err
                  : 'Pack failed'
        throw new PackApiError(message)
    }
}

export async function packWindows(
    project: AppProject
): Promise<PackWindowsResult> {
    if (!isTauri()) {
        throw new PackApiError(
            'Windows packaging requires the Tauri desktop app (npm run tauri:dev).'
        )
    }

    try {
        const iconPath =
            (await resolvePackIconPath(project.iconPath ?? '')) ?? null
        return await invoke<PackWindowsResult>('pack_windows', {
            project: { ...project, iconPath },
        })
    } catch (err) {
        if (err instanceof PackApiError) throw err
        const message =
            err instanceof Error
                ? err.message
                : typeof err === 'string'
                  ? err
                  : 'Pack failed'
        throw new PackApiError(message)
    }
}

export async function packWebclip(
    project: AppProject
): Promise<PackWebclipResult> {
    if (!isTauri()) {
        throw new PackApiError(
            'WebClip packaging requires the Tauri desktop app (npm run tauri:dev).'
        )
    }

    try {
        const iconPath =
            (await resolvePackIconPath(project.iconPath ?? '')) ?? null
        return await invoke<PackWebclipResult>('pack_webclip', {
            project: { ...project, iconPath },
        })
    } catch (err) {
        if (err instanceof PackApiError) throw err
        const message =
            err instanceof Error
                ? err.message
                : typeof err === 'string'
                  ? err
                  : 'Pack failed'
        throw new PackApiError(message)
    }
}

export async function listenPackProgress(
    onProgress: (p: PackProgress) => void
): Promise<UnlistenFn> {
    if (!isTauri()) {
        return () => {}
    }
    return listen<PackProgress>('pack-progress', (event) => {
        onProgress(event.payload)
    })
}

export async function revealPath(path: string): Promise<void> {
    if (!isTauri() || !path) return
    const { revealItemInDir } = await import('@tauri-apps/plugin-opener')
    await revealItemInDir(path)
}

export async function templateEnsure(): Promise<{
    apkReady: boolean
    macosReady?: boolean
    iosReady?: boolean
    windowsReady?: boolean
    webclipReady?: boolean
    keystoreReady: boolean
    templatesDir: string
}> {
    if (!isTauri()) {
        return { apkReady: false, keystoreReady: false, templatesDir: '' }
    }
    return invoke('template_ensure')
}
