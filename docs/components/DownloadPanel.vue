<script setup lang="ts">
/**
 * Download center for docs.
 * Prefers build-time data from docs/static/releases.data.ts.
 * If prefetch failed (empty snapshot), falls back to a client GitHub fetch.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { data as releasesData } from '../static/releases.data'
import {
    normalizeReleases,
    RELEASES_URL,
    type ArchKey,
    type GithubRelease,
    type PackageKey,
    type PlatformKey,
    type ReleaseAsset,
} from '../static/parseReleases'

type LocaleKey = 'zh' | 'en'
type MatchTier = 'perfect' | 'archFallback' | 'osFallback' | 'emptyPlatform'

type DetectedSystem = {
    platform: PlatformKey | null
    arch: ArchKey | null
}

type Recommendation = {
    asset: ReleaseAsset | null
    platform: PlatformKey
    tier: MatchTier
}

type ArchGroup = {
    arch: ArchKey
    assets: ReleaseAsset[]
}

const COPY = {
    zh: {
        loading: '正在获取最新版本…',
        error: '暂时无法获取 GitHub Releases，请稍后重试。',
        noAssets: '当前发布中没有可展示的安装包。',
        recommended: '推荐给你',
        otherDownloads: '其他平台',
        githubRelease: 'GitHub Release',
        directDownload: '立即下载',
        proxyDownload: '加速下载1',
        proxyDownloadV6: '加速下载2',
        exactMatch: (name: string) =>
            `检测到你正在使用 ${name}，已为你选好安装包`,
        archFallback: '已匹配当前系统，架构为可用备选',
        osFallback: '未能识别设备，展示默认热门安装包',
        emptyPlatformHint: (name: string) =>
            `检测到你正在使用 ${name}，该平台即将推出`,
        detecting: '正在识别你的设备…',
        detected: '推荐',
        emptyPlatform: '该平台暂无安装包',
        comingSoon: '即将推出',
        android: 'Android',
        ios: 'iOS',
        windows: 'Windows',
        macos: 'macOS',
        linux: 'Linux',
        x64: 'x64',
        arm64: 'ARM64',
        universal: 'Universal',
        apk: 'APK',
        ipa: 'IPA',
        exe: 'Setup',
        msi: 'MSI',
        dmg: 'DMG',
        app: 'App Bundle',
        deb: 'DEB',
        rpm: 'RPM',
        appimage: 'AppImage',
        unknownDevice: '未识别',
    },
    en: {
        loading: 'Loading the latest release…',
        error: 'Unable to load GitHub Releases right now. Please try again later.',
        noAssets: 'No release assets are available in the latest release.',
        recommended: 'Recommended for you',
        otherDownloads: 'Other platforms',
        githubRelease: 'GitHub Release',
        directDownload: 'Download',
        exactMatch: (name: string) =>
            `You're on ${name}. Here's the best match.`,
        archFallback: 'Matched your OS with the closest available CPU build',
        osFallback: 'Device not detected — showing a popular default package',
        emptyPlatformHint: (name: string) =>
            `You're on ${name}. This platform is coming soon.`,
        detecting: 'Detecting your device…',
        detected: 'Recommended',
        emptyPlatform: 'No installs for this platform yet',
        comingSoon: 'Coming soon',
        android: 'Android',
        ios: 'iOS',
        windows: 'Windows',
        macos: 'macOS',
        linux: 'Linux',
        x64: 'x64',
        arm64: 'ARM64',
        universal: 'Universal',
        apk: 'APK',
        ipa: 'IPA',
        exe: 'Setup',
        msi: 'MSI',
        dmg: 'DMG',
        app: 'App Bundle',
        deb: 'DEB',
        rpm: 'RPM',
        appimage: 'AppImage',
        unknownDevice: 'Unknown',
    },
} as const

const { lang } = useData()
const platformOrder: PlatformKey[] = [
    'android',
    'ios',
    'windows',
    'macos',
    'linux',
]
const DEFAULT_PLATFORM: PlatformKey = 'android'
const PROXY_PREFIXES = {
    default: 'https://gh-proxy.org/',
    v6: 'https://v6.gh-proxy.org/',
} as const

const localeKey = computed<LocaleKey>(() =>
    (lang.value || '').toLowerCase().startsWith('en') ? 'en' : 'zh',
)
const ui = computed(() => COPY[localeKey.value])
const isZh = computed(() => localeKey.value === 'zh')

const version = ref(releasesData.version)
const htmlUrl = ref(releasesData.htmlUrl)
const assets = ref<ReleaseAsset[]>(releasesData.assets)
const loading = ref(!releasesData.assets.length)
const error = ref('')
const ready = ref(false)

const detectedSystem = ref<DetectedSystem>({ platform: null, arch: null })
const activePlatform = ref<PlatformKey>(DEFAULT_PLATFORM)

const recommendation = computed<Recommendation | null>(() => {
    const system = detectedSystem.value

    if (system.platform && system.arch) {
        const exact = pickPreferredAsset(
            assets.value.filter(
                (asset) =>
                    asset.platform === system.platform &&
                    asset.arch === system.arch,
            ),
        )
        if (exact)
            return { asset: exact, platform: exact.platform, tier: 'perfect' }
    }

    if (system.platform) {
        const sameOs = pickPreferredAsset(
            assets.value.filter((asset) => asset.platform === system.platform),
        )
        if (sameOs)
            return {
                asset: sameOs,
                platform: sameOs.platform,
                tier: 'archFallback',
            }
        return {
            asset: null,
            platform: system.platform,
            tier: 'emptyPlatform',
        }
    }

    const fallback = pickPreferredAsset(assets.value)
    return fallback
        ? { asset: fallback, platform: fallback.platform, tier: 'osFallback' }
        : null
})

const tabPlatforms = computed(() => {
    const detected = detectedSystem.value.platform
    if (!detected) return platformOrder
    return [detected, ...platformOrder.filter((p) => p !== detected)]
})

const activeArchGroups = computed<ArchGroup[]>(() => {
    const list = sortAssets(
        assets.value.filter((asset) => asset.platform === activePlatform.value),
    )
    const groups: ArchGroup[] = []
    for (const arch of preferredArchs(activePlatform.value)) {
        const archAssets = list.filter((asset) => asset.arch === arch)
        if (archAssets.length) groups.push({ arch, assets: archAssets })
    }
    return groups
})

const deviceLabel = computed(() => {
    const system = detectedSystem.value
    if (system.platform && system.arch && system.arch !== 'universal') {
        return `${platformLabel(system.platform)} · ${archLabel(system.arch)}`
    }
    if (system.platform) return platformLabel(system.platform)
    return ui.value.unknownDevice
})

const matchHint = computed(() => {
    if (!ready.value) return ui.value.detecting
    const rec = recommendation.value
    if (!rec) return ui.value.osFallback
    if (rec.tier === 'perfect')
        return ui.value.exactMatch(platformLabel(rec.platform))
    if (rec.tier === 'archFallback') return ui.value.archFallback
    if (rec.tier === 'emptyPlatform')
        return ui.value.emptyPlatformHint(platformLabel(rec.platform))
    return ui.value.osFallback
})

const recommendTitle = computed(() => {
    const rec = recommendation.value
    if (!rec) return ''
    if (!rec.asset) return platformLabel(rec.platform)
    const platformName = platformLabel(rec.asset.platform)
    const suffix = packageLabel(rec.asset.packageType)
    if (rec.asset.arch !== 'universal') {
        return `${platformName} ${archLabel(rec.asset.arch)} · ${suffix}`
    }
    return `${platformName} · ${suffix}`
})

const recommendStats = computed(() => {
    const size = recommendation.value?.asset
        ? formatSize(recommendation.value.asset.size)
        : ''
    return [version.value, deviceLabel.value, size].filter(Boolean)
})

watch(
    () => detectedSystem.value.platform,
    (platform) => {
        if (platform) activePlatform.value = platform
    },
)

function platformLabel(platform: PlatformKey): string {
    return ui.value[platform]
}

function archLabel(arch: ArchKey): string {
    return ui.value[arch]
}

function packageLabel(packageType: PackageKey): string {
    return ui.value[packageType]
}

function normalizeArch(value: string): ArchKey | null {
    if (/(arm64|aarch64)/.test(value)) return 'arm64'
    if (/(x64|x86_64|amd64)/.test(value)) return 'x64'
    return null
}

function detectSystem(): DetectedSystem {
    if (typeof navigator === 'undefined') {
        return { platform: null, arch: null }
    }

    const ua = (navigator.userAgent || '').toLowerCase()
    const navPlatform = (navigator.platform || '').toLowerCase()
    const source = [
        readUserAgentDataPlatform(),
        navPlatform,
        ua,
    ]
        .join(' ')
        .toLowerCase()

    const archSource = [
        readUserAgentDataArch(),
        ua,
        navPlatform,
    ]
        .join(' ')
        .toLowerCase()

    const isIPadOs =
        navPlatform === 'macintel' &&
        typeof navigator.maxTouchPoints === 'number' &&
        navigator.maxTouchPoints > 1

    let platform: PlatformKey | null = null
    if (ua.includes('android')) platform = 'android'
    else if (/iphone|ipad|ipod/.test(ua) || isIPadOs) platform = 'ios'
    else if (/(win)/.test(source)) platform = 'windows'
    else if (/(mac|darwin)/.test(source)) platform = 'macos'
    else if (/(linux|x11)/.test(source)) platform = 'linux'

    const arch: ArchKey | null =
        platform === 'android' || platform === 'ios'
            ? 'universal'
            : normalizeArch(archSource)

    return { platform, arch }
}

function readUserAgentDataPlatform(): string {
    const navigatorWithUserAgentData = navigator as Navigator & {
        userAgentData?: { platform?: string }
    }
    return navigatorWithUserAgentData.userAgentData?.platform || ''
}

function readUserAgentDataArch(): string {
    const navigatorWithUserAgentData = navigator as Navigator & {
        userAgentData?: { architecture?: string }
    }
    return navigatorWithUserAgentData.userAgentData?.architecture || ''
}

function preferredArchs(platform: PlatformKey): ArchKey[] {
    if (platform === 'android' || platform === 'ios') {
        return ['universal', 'arm64', 'x64']
    }
    if (platform === 'macos') return ['arm64', 'x64']
    return ['x64', 'arm64']
}

function packageRank(asset: ReleaseAsset): number {
    const ranks: Record<PlatformKey, PackageKey[]> = {
        android: [
            'apk',
            'ipa',
            'exe',
            'msi',
            'dmg',
            'app',
            'deb',
            'rpm',
            'appimage',
        ],
        ios: [
            'ipa',
            'apk',
            'exe',
            'msi',
            'dmg',
            'app',
            'deb',
            'rpm',
            'appimage',
        ],
        windows: [
            'exe',
            'msi',
            'app',
            'dmg',
            'deb',
            'rpm',
            'appimage',
            'apk',
            'ipa',
        ],
        macos: [
            'dmg',
            'app',
            'exe',
            'msi',
            'deb',
            'rpm',
            'appimage',
            'apk',
            'ipa',
        ],
        linux: [
            'deb',
            'appimage',
            'rpm',
            'app',
            'dmg',
            'exe',
            'msi',
            'apk',
            'ipa',
        ],
    }
    return ranks[asset.platform].indexOf(asset.packageType)
}

function sortAssets(list: ReleaseAsset[]): ReleaseAsset[] {
    return [...list].sort((a, b) => {
        if (a.platform !== b.platform) {
            return (
                platformOrder.indexOf(a.platform) -
                platformOrder.indexOf(b.platform)
            )
        }
        if (a.arch !== b.arch) {
            return (
                preferredArchs(a.platform).indexOf(a.arch) -
                preferredArchs(b.platform).indexOf(b.arch)
            )
        }
        const packageOrder = packageRank(a) - packageRank(b)
        if (packageOrder !== 0) return packageOrder
        return a.name.localeCompare(b.name)
    })
}

function pickPreferredAsset(list: ReleaseAsset[]): ReleaseAsset | null {
    const [first] = sortAssets(list)
    return first || null
}

function formatSize(size: number): string {
    if (!size) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let value = size
    let unitIndex = 0
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024
        unitIndex += 1
    }
    return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${
        units[unitIndex]
    }`
}

function proxyDownloadUrl(
    url: string,
    kind: keyof typeof PROXY_PREFIXES = 'default',
): string {
    return `${PROXY_PREFIXES[kind]}${url}`
}

function isRecommended(asset: ReleaseAsset): boolean {
    return recommendation.value?.asset?.id === asset.id
}

function platformCount(platform: PlatformKey): number {
    return assets.value.filter((asset) => asset.platform === platform).length
}

function applySnapshot(snapshot: {
    version: string
    htmlUrl: string
    assets: ReleaseAsset[]
}) {
    version.value = snapshot.version
    htmlUrl.value = snapshot.htmlUrl
    assets.value = snapshot.assets
    if (detectedSystem.value.platform) {
        activePlatform.value = detectedSystem.value.platform
    } else if (snapshot.assets[0]) {
        activePlatform.value = snapshot.assets[0].platform
    }
}

async function loadClientFallback() {
    loading.value = true
    error.value = ''
    try {
        const res = await fetch(RELEASES_URL, {
            headers: { Accept: 'application/vnd.github+json' },
            cache: 'no-store',
        })
        if (!res.ok) throw new Error(String(res.status))
        const payload = (await res.json()) as GithubRelease[]
        const snapshot = normalizeReleases(payload)
        if (!snapshot.assets.length) throw new Error('empty')
        applySnapshot(snapshot)
    } catch {
        error.value = ui.value.error
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    detectedSystem.value = detectSystem()
    if (detectedSystem.value.platform) {
        activePlatform.value = detectedSystem.value.platform
    } else if (recommendation.value) {
        activePlatform.value = recommendation.value.platform
    }
    ready.value = true

    if (!assets.value.length) await loadClientFallback()
})
</script>

<template>
    <section class="download-page">
        <div v-if="loading" class="dl-state">{{ ui.loading }}</div>
        <div v-else-if="error" class="dl-state dl-state-error">{{ error }}</div>
        <div v-else-if="!assets.length" class="dl-state">{{ ui.noAssets }}</div>

        <template v-else>
            <article v-if="recommendation" class="dl-recommend">
                <div class="dl-recommend-main">
                    <span class="dl-recommend-kicker">{{
                        ui.recommended
                    }}</span>
                    <h1>{{ recommendTitle }}</h1>
                    <p class="dl-recommend-hint">{{ matchHint }}</p>
                    <p
                        v-if="recommendation.asset?.name"
                        class="dl-recommend-file"
                    >
                        {{ recommendation.asset.name }}
                    </p>
                    <div class="dl-recommend-stats">
                        <span v-for="stat in recommendStats" :key="stat">{{
                            stat
                        }}</span>
                    </div>
                </div>

                <div class="dl-recommend-actions">
                    <template v-if="recommendation.asset">
                        <template v-if="isZh">
                            <a
                                class="dl-btn dl-btn-primary"
                                :href="
                                    proxyDownloadUrl(recommendation.asset.url)
                                "
                                target="_blank"
                                rel="noreferrer"
                            >
                                {{ COPY.zh.proxyDownload }}
                            </a>
                            <a
                                class="dl-btn dl-btn-proxy"
                                :href="
                                    proxyDownloadUrl(
                                        recommendation.asset.url,
                                        'v6',
                                    )
                                "
                                target="_blank"
                                rel="noreferrer"
                            >
                                {{ COPY.zh.proxyDownloadV6 }}
                            </a>
                        </template>
                        <a
                            v-else
                            class="dl-btn dl-btn-primary"
                            :href="recommendation.asset.url"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {{ ui.directDownload }}
                        </a>
                        <a
                            class="dl-btn dl-btn-ghost"
                            :href="htmlUrl"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {{ ui.githubRelease }}
                        </a>
                    </template>
                    <template v-else>
                        <button
                            class="dl-btn dl-btn-ghost"
                            type="button"
                            disabled
                        >
                            {{ ui.comingSoon }}
                        </button>
                        <a
                            class="dl-btn dl-btn-ghost"
                            :href="htmlUrl"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {{ ui.githubRelease }}
                        </a>
                    </template>
                </div>
            </article>

            <section class="dl-browse" aria-label="platforms">
                <div class="dl-browse-head">
                    <h2>{{ ui.otherDownloads }}</h2>
                </div>

                <div class="dl-tabs" role="tablist">
                    <button
                        v-for="platform in tabPlatforms"
                        :key="platform"
                        type="button"
                        role="tab"
                        class="dl-tab"
                        :class="{ active: activePlatform === platform }"
                        :aria-selected="activePlatform === platform"
                        @click="activePlatform = platform"
                    >
                        <span>{{ platformLabel(platform) }}</span>
                        <em v-if="detectedSystem.platform === platform">{{
                            ui.detected
                        }}</em>
                        <small>{{ platformCount(platform) }}</small>
                    </button>
                </div>

                <div class="dl-panel" role="tabpanel">
                    <div v-if="!activeArchGroups.length" class="dl-state">
                        {{ ui.emptyPlatform }}
                    </div>

                    <div
                        v-for="group in activeArchGroups"
                        :key="group.arch"
                        class="dl-arch-group"
                    >
                        <h3>{{ archLabel(group.arch) }}</h3>
                        <ul class="dl-list">
                            <li
                                v-for="asset in group.assets"
                                :key="asset.id"
                            >
                                <a
                                    class="dl-row"
                                    :class="{
                                        recommended: isRecommended(asset),
                                    }"
                                    :href="asset.url"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <div class="dl-row-main">
                                        <strong>{{
                                            packageLabel(asset.packageType)
                                        }}</strong>
                                        <span class="dl-row-name">{{
                                            asset.name
                                        }}</span>
                                    </div>
                                    <div class="dl-row-meta">
                                        <span v-if="asset.size">{{
                                            formatSize(asset.size)
                                        }}</span>
                                        <span class="dl-row-cta">{{
                                            ui.directDownload
                                        }}</span>
                                    </div>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>
        </template>
    </section>
</template>
