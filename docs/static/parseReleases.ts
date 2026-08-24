/**
 * Shared release parsing for build-time loader and client fallback.
 */
export type PlatformKey = 'android' | 'ios' | 'windows' | 'macos' | 'linux'
export type ArchKey = 'x64' | 'arm64' | 'universal'
export type PackageKey =
    | 'apk'
    | 'ipa'
    | 'exe'
    | 'msi'
    | 'dmg'
    | 'app'
    | 'deb'
    | 'rpm'
    | 'appimage'

export type ReleaseAsset = {
    id: string
    name: string
    url: string
    size: number
    downloads: number
    updatedAt: string
    platform: PlatformKey
    arch: ArchKey
    packageType: PackageKey
}

export type ReleasesData = {
    fetchedAt: string
    version: string
    htmlUrl: string
    assets: ReleaseAsset[]
}

export type GithubRelease = {
    name?: string
    tag_name?: string
    html_url?: string
    draft?: boolean
    prerelease?: boolean
    assets?: Array<{
        id?: number
        name?: string
        size?: number
        updated_at?: string
        download_count?: number
        browser_download_url?: string
    }>
}

export const GITHUB_REPO = 'coleomo/PacBao'
export const RELEASES_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`
export const RELEASES_PAGE_URL = `https://github.com/${GITHUB_REPO}/releases`

function normalizeArch(value: string): ArchKey | null {
    if (/(arm64|aarch64)/.test(value)) return 'arm64'
    if (/(x64|x86_64|amd64)/.test(value)) return 'x64'
    return null
}

function parsePlatform(name: string): PlatformKey | null {
    const lower = name.toLowerCase()
    if (lower.endsWith('.apk') || lower.includes('android')) return 'android'
    if (lower.endsWith('.ipa') || lower.includes('ios')) return 'ios'
    if (
        lower.endsWith('.exe') ||
        lower.endsWith('.msi') ||
        lower.includes('windows')
    ) {
        return 'windows'
    }
    if (
        lower.endsWith('.dmg') ||
        lower.endsWith('.app.tar.gz') ||
        lower.includes('darwin')
    ) {
        return 'macos'
    }
    if (
        lower.endsWith('.appimage') ||
        lower.endsWith('.deb') ||
        lower.endsWith('.rpm') ||
        lower.includes('linux')
    ) {
        return 'linux'
    }
    return null
}

function parsePackageType(name: string): PackageKey | null {
    const lower = name.toLowerCase()
    if (lower.endsWith('.apk')) return 'apk'
    if (lower.endsWith('.ipa')) return 'ipa'
    if (lower.endsWith('.exe')) return 'exe'
    if (lower.endsWith('.msi')) return 'msi'
    if (lower.endsWith('.dmg')) return 'dmg'
    if (lower.endsWith('.app.tar.gz')) return 'app'
    if (lower.endsWith('.deb')) return 'deb'
    if (lower.endsWith('.rpm')) return 'rpm'
    if (lower.endsWith('.appimage')) return 'appimage'
    return null
}

export function parseReleaseAsset(
    raw: NonNullable<GithubRelease['assets']>[number],
): ReleaseAsset | null {
    const name = raw.name || ''
    const url = raw.browser_download_url || ''
    if (
        !name ||
        !url ||
        name.endsWith('.sig') ||
        name === 'latest.json' ||
        name === 'update.json'
    ) {
        return null
    }

    const platform = parsePlatform(name)
    const packageType = parsePackageType(name)
    let arch = normalizeArch(name.toLowerCase())
    if (!arch && (packageType === 'apk' || packageType === 'ipa')) {
        arch = 'universal'
    }
    if (!platform || !arch || !packageType) return null

    return {
        id: String(raw.id || name),
        name,
        url,
        size: raw.size || 0,
        downloads: raw.download_count || 0,
        updatedAt: raw.updated_at || '',
        platform,
        arch,
        packageType,
    }
}

export function emptyReleasesData(): ReleasesData {
    return {
        fetchedAt: '',
        version: '',
        htmlUrl: RELEASES_PAGE_URL,
        assets: [],
    }
}

export function normalizeReleases(payload: GithubRelease[]): ReleasesData {
    const latest = payload.find((item) => !item.draft && !item.prerelease)
    if (!latest) return emptyReleasesData()

    const assets = (latest.assets || [])
        .map((asset) => parseReleaseAsset(asset))
        .filter((asset): asset is ReleaseAsset => Boolean(asset))

    return {
        fetchedAt: new Date().toISOString(),
        version: latest.tag_name || latest.name || '',
        htmlUrl:
            latest.html_url ||
            (latest.tag_name
                ? `https://github.com/${GITHUB_REPO}/releases/tag/${latest.tag_name}`
                : RELEASES_PAGE_URL),
        assets,
    }
}
