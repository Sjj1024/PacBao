<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'

type PlatformId = 'android' | 'ios' | 'windows' | 'macos' | 'linux'

interface Asset {
  kind: string
  name: string
  size: string
  url: string
  /** Shown in the recommend hero title, e.g. "APK" / "Setup" */
  titleSuffix?: string
}

interface ArchGroup {
  arch: string
  assets: Asset[]
}

interface PlatformPack {
  id: PlatformId
  groups: ArchGroup[]
}

/** Update URLs / sizes here when new installers ship. */
const VERSION = 'PacBao'
const GITHUB_RELEASES = 'https://github.com/PakePlus'

const PLATFORMS: PlatformPack[] = [
  {
    id: 'android',
    groups: [
      {
        arch: 'Universal',
        assets: [
          {
            kind: 'APK',
            name: 'app-debug.apk',
            size: '',
            url: 'https://qmtdata.openqmt.com/app-debug.apk',
            titleSuffix: 'APK',
          },
        ],
      },
    ],
  },
  {
    id: 'ios',
    groups: [
      {
        arch: 'Universal',
        assets: [
          {
            kind: 'IPA',
            name: 'PacBao.ipa',
            size: '',
            url: '',
            titleSuffix: 'IPA',
          },
        ],
      },
    ],
  },
  {
    id: 'windows',
    groups: [
      {
        arch: 'x64',
        assets: [
          {
            kind: 'Setup',
            name: 'PacBao_x64-setup.exe',
            size: '',
            url: '',
            titleSuffix: 'Setup',
          },
        ],
      },
    ],
  },
  {
    id: 'macos',
    groups: [
      {
        arch: 'Universal',
        assets: [
          {
            kind: 'DMG',
            name: 'PacBao.dmg',
            size: '',
            url: '',
            titleSuffix: 'DMG',
          },
        ],
      },
    ],
  },
  {
    id: 'linux',
    groups: [
      {
        arch: 'x64',
        assets: [
          {
            kind: 'AppImage',
            name: 'PacBao_amd64.AppImage',
            size: '',
            url: '',
            titleSuffix: 'AppImage',
          },
        ],
      },
    ],
  },
]

/** Default when UA cannot be mapped — match PeekShell: show a popular pack. */
const DEFAULT_PLATFORM: PlatformId = 'android'

function detectPlatform(): PlatformId | null {
  if (typeof navigator === 'undefined') return null

  const ua = navigator.userAgent.toLowerCase()
  const platform = (navigator.platform || '').toLowerCase()

  if (ua.includes('android')) return 'android'

  const isIPadOs =
    platform === 'macintel' &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1

  if (/iphone|ipad|ipod/.test(ua) || isIPadOs) return 'ios'
  if (ua.includes('win') || platform.startsWith('win')) return 'windows'
  if (ua.includes('mac') || platform.startsWith('mac')) return 'macos'
  if (ua.includes('linux') || platform.startsWith('linux')) return 'linux'
  return null
}

function firstAsset(pack: PlatformPack | undefined): Asset | null {
  return pack?.groups[0]?.assets[0] ?? null
}

function proxyUrl(url: string, host: string): string {
  if (!url || !url.includes('github.com')) return url
  return `https://${host}/https://${url.replace(/^https?:\/\//, '')}`
}

const zh = {
  kicker: '推荐给你',
  detecting: '正在识别你的设备…',
  matched: (name: string) => `检测到你正在使用 ${name}，已为你选好安装包`,
  unmatched: '未能识别设备，展示默认热门安装包',
  unknownDevice: '未识别',
  otherPlatforms: '其他平台',
  recommended: '推荐',
  downloadNow: '立即下载',
  comingSoon: '即将推出',
  accelerate1: '加速下载1',
  accelerate2: '加速下载2',
  githubRelease: 'GitHub Release',
  names: {
    android: 'Android',
    ios: 'iOS',
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux',
  } as Record<PlatformId, string>,
}

const en = {
  kicker: 'Recommended for you',
  detecting: 'Detecting your device…',
  matched: (name: string) => `You're on ${name}. Here's the best match.`,
  unmatched: 'Device not detected — showing a popular default package',
  unknownDevice: 'Unknown',
  otherPlatforms: 'Other platforms',
  recommended: 'Recommended',
  downloadNow: 'Download',
  comingSoon: 'Coming soon',
  accelerate1: 'Mirror 1',
  accelerate2: 'Mirror 2',
  githubRelease: 'GitHub Release',
  names: {
    android: 'Android',
    ios: 'iOS',
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux',
  } as Record<PlatformId, string>,
}

const { lang } = useData()
const t = computed(() => (lang.value.startsWith('zh') ? zh : en))

const ready = ref(false)
const detected = ref<PlatformId | null>(null)
const activePlatform = ref<PlatformId>(DEFAULT_PLATFORM)

onMounted(() => {
  detected.value = detectPlatform()
  activePlatform.value = detected.value ?? DEFAULT_PLATFORM
  ready.value = true
})

watch(detected, (id) => {
  if (id) activePlatform.value = id
})

const recommendedPack = computed(() => {
  const id = detected.value ?? DEFAULT_PLATFORM
  return PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0]
})

const recommendedAsset = computed(() => firstAsset(recommendedPack.value))

const recommendTitle = computed(() => {
  const pack = recommendedPack.value
  const asset = recommendedAsset.value
  const platformName = t.value.names[pack.id]
  const arch = pack.groups[0]?.arch
  const suffix = asset?.titleSuffix || asset?.kind || ''
  if (arch && arch !== 'Universal') {
    return `${platformName} ${arch} · ${suffix}`
  }
  return `${platformName} · ${suffix}`
})

const recommendHint = computed(() => {
  if (!ready.value) return t.value.detecting
  if (detected.value) return t.value.matched(t.value.names[detected.value])
  return t.value.unmatched
})

const recommendStats = computed(() => {
  const deviceLabel = detected.value
    ? t.value.names[detected.value]
    : t.value.unknownDevice
  const size = recommendedAsset.value?.size
  return [VERSION, deviceLabel, size].filter(Boolean) as string[]
})

const activePack = computed(
  () => PLATFORMS.find((p) => p.id === activePlatform.value) ?? PLATFORMS[0],
)

function assetCount(pack: PlatformPack): number {
  return pack.groups.reduce((n, g) => n + g.assets.length, 0)
}

function isGithubAsset(url: string): boolean {
  return url.includes('github.com')
}
</script>

<template>
  <section class="download-page">
    <article class="dl-recommend">
      <div class="dl-recommend-main">
        <span class="dl-recommend-kicker">{{ t.kicker }}</span>
        <h1>{{ recommendTitle }}</h1>
        <p class="dl-recommend-hint">{{ recommendHint }}</p>
        <p v-if="recommendedAsset?.name" class="dl-recommend-file">
          {{ recommendedAsset.name }}
        </p>
        <div class="dl-recommend-stats">
          <span v-for="stat in recommendStats" :key="stat">{{ stat }}</span>
        </div>
      </div>

      <div class="dl-recommend-actions">
        <template v-if="recommendedAsset?.url">
          <a
            class="dl-btn dl-btn-primary"
            :href="
              isGithubAsset(recommendedAsset.url)
                ? proxyUrl(recommendedAsset.url, 'gh-proxy.org')
                : recommendedAsset.url
            "
            target="_blank"
            rel="noreferrer"
          >
            {{
              isGithubAsset(recommendedAsset.url)
                ? t.accelerate1
                : t.downloadNow
            }}
          </a>
          <a
            v-if="isGithubAsset(recommendedAsset.url)"
            class="dl-btn dl-btn-proxy"
            :href="proxyUrl(recommendedAsset.url, 'v6.gh-proxy.org')"
            target="_blank"
            rel="noreferrer"
          >
            {{ t.accelerate2 }}
          </a>
          <a
            class="dl-btn dl-btn-ghost"
            :href="GITHUB_RELEASES"
            target="_blank"
            rel="noreferrer"
          >
            {{ t.githubRelease }}
          </a>
        </template>
        <button v-else class="dl-btn dl-btn-ghost" type="button" disabled>
          {{ t.comingSoon }}
        </button>
      </div>
    </article>

    <section class="dl-browse" aria-label="platforms">
      <div class="dl-browse-head">
        <h2>{{ t.otherPlatforms }}</h2>
      </div>

      <div class="dl-tabs" role="tablist">
        <button
          v-for="pack in PLATFORMS"
          :key="pack.id"
          type="button"
          role="tab"
          class="dl-tab"
          :class="{ active: pack.id === activePlatform }"
          :aria-selected="pack.id === activePlatform"
          @click="activePlatform = pack.id"
        >
          <span>{{ t.names[pack.id] }}</span>
          <em v-if="pack.id === detected">{{ t.recommended }}</em>
          <small>{{ assetCount(pack) }}</small>
        </button>
      </div>

      <div class="dl-panel" role="tabpanel">
        <div
          v-for="group in activePack.groups"
          :key="group.arch"
          class="dl-arch-group"
        >
          <h3>{{ group.arch }}</h3>
          <ul class="dl-list">
            <li v-for="asset in group.assets" :key="asset.name">
              <a
                v-if="asset.url"
                class="dl-row"
                :class="{
                  recommended:
                    activePlatform === (detected ?? DEFAULT_PLATFORM) &&
                    asset.name === recommendedAsset?.name,
                }"
                :href="asset.url"
                target="_blank"
                rel="noreferrer"
              >
                <div class="dl-row-main">
                  <strong>{{ asset.kind }}</strong>
                  <span class="dl-row-name">{{ asset.name }}</span>
                </div>
                <div class="dl-row-meta">
                  <span v-if="asset.size">{{ asset.size }}</span>
                  <span class="dl-row-cta">{{ t.downloadNow }}</span>
                </div>
              </a>
              <div v-else class="dl-row is-disabled">
                <div class="dl-row-main">
                  <strong>{{ asset.kind }}</strong>
                  <span class="dl-row-name">{{ asset.name }}</span>
                </div>
                <div class="dl-row-meta">
                  <span class="dl-row-cta is-muted">{{ t.comingSoon }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </section>
</template>
