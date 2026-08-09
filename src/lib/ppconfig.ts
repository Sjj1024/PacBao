import ppconfigTemplate from '@/assets/ppconfig.json'

const APP_NAME_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

export type PpConfig = typeof ppconfigTemplate

export type PpConfigApiProject = {
    name: string
    show_name?: string
    app_id?: string
    url: string
    version?: string
    icon: string
}

export type PpConfigFormFields = {
    name: string
    showName: string
    url: string
    app_id: string
    version: string
    icon: string
    /** 窗口保持，对应 config.state */
    keepWindow: boolean
    /** 单例模式，对应 config.single */
    singleton: boolean
}

/** 解析接口返回的 config（对象或 JSON 字符串）。 */
export function parsePpConfig(value: unknown): PpConfig | null {
    if (value == null) return null
    let parsed: unknown = value
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) return null
        try {
            parsed = JSON.parse(trimmed)
        } catch {
            return null
        }
    }
    if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
    ) {
        return null
    }
    return parsed as PpConfig
}

type PpConfigPlatformSyncFields = Pick<
    PpConfigFormFields,
    'name' | 'showName' | 'url' | 'app_id' | 'version' | 'icon'
>

function syncPlatformFields(
    config: PpConfig,
    fields: PpConfigPlatformSyncFields,
) {
    config.ios.name = fields.name
    config.ios.showName = fields.showName
    config.ios.webUrl = fields.url
    config.ios.version = fields.version
    config.ios.id = fields.app_id
    config.ios.icon = fields.icon

    config.android.name = fields.name
    config.android.showName = fields.showName
    config.android.webUrl = fields.url
    config.android.version = fields.version
    config.android.id = fields.app_id
    config.android.icon = fields.icon

    config.desktop.name = fields.name
    config.desktop.showName = fields.showName
    config.desktop.webUrl = fields.url
    config.desktop.version = fields.version
    config.desktop.id = fields.app_id

    config.windows.title = fields.showName
    config.windows.url = fields.url
}

/** 无 config 时根据项目字段生成默认 ppconfig 结构。 */
export function buildPpConfigFromApiProject(
    item: PpConfigApiProject,
): PpConfig {
    const config = structuredClone(ppconfigTemplate) as PpConfig
    const name = item.name.trim()
    const showName = (item.show_name || item.name).trim()
    const appId = (item.app_id || item.name).trim()
    const url = item.url.trim()
    const version = (item.version || '1.0.0').trim()
    const icon = item.icon.trim()

    config.name = name.trim()
    config.showName = showName
    config.url = url
    config.appid = appId
    config.version = version
    config.icon = icon
    if (icon) {
        config.iconPath = icon
    }

    syncPlatformFields(config, {
        name,
        showName,
        url,
        app_id: appId,
        version,
        icon,
    })
    return config
}

/** 将详情页表单字段合并进 ppconfig，保留其余配置项。 */
export type PublishFormValues = {
    method: string
    platforms: string[]
    debug: boolean
    description: string
}

/** 发布平台选项值（写入 ppconfig.platform）。 */
export const PUBLISH_PLATFORM_WIN_X64 = 'win-x64'
export const PUBLISH_PLATFORM_WIN_ARM = 'win-arm'
export const PUBLISH_PLATFORM_MAC_X64 = 'mac-x64'
export const PUBLISH_PLATFORM_MAC_ARM = 'mac-arm'
export const PUBLISH_PLATFORM_LINUX_X64 = 'linux-x64'
export const PUBLISH_PLATFORM_LINUX_ARM = 'linux-arm'

export const DEFAULT_PUBLISH_PLATFORMS = [
    PUBLISH_PLATFORM_MAC_X64,
    PUBLISH_PLATFORM_MAC_ARM,
] as const

export const DEFAULT_PUBLISH_DIALOG_PLATFORMS = [
    PUBLISH_PLATFORM_WIN_X64,
    PUBLISH_PLATFORM_MAC_ARM,
] as const

/** 移动端发布平台选项值。 */
export const PUBLISH_PLATFORM_ANDROID = 'android'
export const PUBLISH_PLATFORM_IOS = 'ios'
export const PUBLISH_PLATFORM_IOSCLIP = 'iosclip'
/** 本地打包用的桌面平台聚合值（不区分 CPU 架构；不可用 `windows`，与云端 method 冲突）。 */
export const PUBLISH_PLATFORM_WINDOWS = 'win'
export const PUBLISH_PLATFORM_MACOS = 'mac'

export const MOBILE_PUBLISH_PLATFORMS = new Set([
    PUBLISH_PLATFORM_ANDROID,
    PUBLISH_PLATFORM_IOS,
    PUBLISH_PLATFORM_IOSCLIP,
])

/** 本地打包：单选平台。 */
export const LOCAL_PUBLISH_PLATFORMS = [
    PUBLISH_PLATFORM_ANDROID,
    PUBLISH_PLATFORM_IOS,
    PUBLISH_PLATFORM_IOSCLIP,
    PUBLISH_PLATFORM_WINDOWS,
    PUBLISH_PLATFORM_MACOS,
] as const

export const LOCAL_PUBLISH_PLATFORM_SET = new Set<string>(LOCAL_PUBLISH_PLATFORMS)

export const DEFAULT_LOCAL_PUBLISH_DIALOG_PLATFORMS = [
    PUBLISH_PLATFORM_ANDROID,
] as const

export const DEFAULT_MOBILE_PUBLISH_DIALOG_PLATFORMS = [
    PUBLISH_PLATFORM_ANDROID,
] as const

/** Map cloud/electron arch platforms onto local single-select values. */
export function toLocalPublishPlatform(platforms: string[]): string {
    for (const platform of platforms) {
        if (LOCAL_PUBLISH_PLATFORM_SET.has(platform)) return platform
        if (
            platform === PUBLISH_PLATFORM_WIN_X64 ||
            platform === PUBLISH_PLATFORM_WIN_ARM
        ) {
            return PUBLISH_PLATFORM_WINDOWS
        }
        if (
            platform === PUBLISH_PLATFORM_MAC_X64 ||
            platform === PUBLISH_PLATFORM_MAC_ARM
        ) {
            return PUBLISH_PLATFORM_MACOS
        }
    }
    return DEFAULT_LOCAL_PUBLISH_DIALOG_PLATFORMS[0]
}

export const PUBLISH_METHOD_CLOUD = 'windows'
export const PUBLISH_METHOD_LOCAL = 'local'
export const PUBLISH_METHOD_ELECTRON = 'electron'

const PUBLISH_METHODS = new Set([
    PUBLISH_METHOD_CLOUD,
    PUBLISH_METHOD_LOCAL,
    PUBLISH_METHOD_ELECTRON,
])

const LEGACY_PUBLISH_METHOD_MAP: Record<string, string> = {
    cloud: PUBLISH_METHOD_CLOUD,
}

const LEGACY_PUBLISH_PLATFORM_MAP: Record<string, string> = {
    '1-1': PUBLISH_PLATFORM_WIN_X64,
    '1-2': PUBLISH_PLATFORM_WIN_ARM,
    '2-1': PUBLISH_PLATFORM_MAC_X64,
    '2-2': PUBLISH_PLATFORM_MAC_ARM,
    '3-1': PUBLISH_PLATFORM_LINUX_X64,
    '3-2': PUBLISH_PLATFORM_LINUX_ARM,
}

function normalizePublishMethod(method: string): string {
    return LEGACY_PUBLISH_METHOD_MAP[method] ?? method
}

/** 将历史平台 id 转为当前发布平台值。 */
export function normalizePublishPlatforms(platforms: string[]): string[] {
    return platforms.map(
        (platform) => LEGACY_PUBLISH_PLATFORM_MAP[platform] ?? platform,
    )
}

function isPublishMethod(value: string): boolean {
    return PUBLISH_METHODS.has(value)
}

/** 从列表中剔除发布方式，保留去重后的发布平台值。 */
function filterPublishPlatformValues(values: string[]): string[] {
    const seen = new Set<string>()
    const result: string[] = []
    for (const value of normalizePublishPlatforms(values)) {
        const normalized = normalizePublishMethod(value)
        if (isPublishMethod(normalized) || seen.has(normalized)) continue
        seen.add(normalized)
        result.push(normalized)
    }
    return result
}

/** 组装 platform 数组：发布方式在首位，其后为所选平台。 */
export function buildPlatformArray(
    method: string,
    platforms: string[],
): string[] {
    const normalizedMethod = normalizePublishMethod(method)
    return [normalizedMethod, ...filterPublishPlatformValues(platforms)]
}

function filterMobilePlatformValues(values: string[]): string[] {
    const seen = new Set<string>()
    const result: string[] = []
    for (const value of values) {
        if (!MOBILE_PUBLISH_PLATFORMS.has(value) || seen.has(value)) continue
        seen.add(value)
        result.push(value)
    }
    return result
}

/** 移动端 platform 数组：仅包含所选的一个移动平台。 */
export function buildMobilePlatformArray(platforms: string[]): string[] {
    const filtered = filterMobilePlatformValues(platforms)
    return filtered.length > 0 ? [filtered[0]] : []
}

/** 移动端 publish / build_type：所选平台值。 */
export function buildMobilePublishValue(platforms: string[]): string {
    return buildMobilePlatformArray(platforms)[0] ?? ''
}

/** 由 ppconfig.platform 拼接 build_type，如 electron_mac-arm_win-x64。 */
export function buildBuildType(config: PpConfig): string {
    return config.platform.join('_')
}

export type BuildTaskPayload = {
    pro_id: number
    name: string
    show_name: string
    app_id: string
    version: string
    description: string
    url: string
    icon: string
    publish: string
    build_type: string
    config: PpConfig
}

export function buildPublishTaskPayload(params: {
    pro_id: number
    name: string
    show_name: string
    app_id: string
    version: string
    description: string
    url: string
    icon: string
    publish: string
    config: PpConfig
}): BuildTaskPayload {
    return {
        ...params,
        build_type: buildBuildType(params.config),
    }
}

export function buildMobilePublishTaskPayload(params: {
    pro_id: number
    name: string
    show_name: string
    app_id: string
    version: string
    description: string
    url: string
    icon: string
    platforms: string[]
    config: PpConfig
}): BuildTaskPayload {
    const publish = buildMobilePublishValue(params.platforms)
    return {
        pro_id: params.pro_id,
        name: params.name,
        show_name: params.show_name,
        app_id: params.app_id,
        version: params.version,
        description: params.description,
        url: params.url,
        icon: params.icon,
        publish,
        build_type: publish,
        config: params.config,
    }
}

/** 从 platform 数组解析发布方式与平台列表。 */
export function parsePlatformArray(platform: string[]): {
    method: string | null
    platforms: string[]
} {
    const normalized = normalizePublishPlatforms([...platform])
    if (normalized.length === 0) {
        return { method: null, platforms: [] }
    }

    const first = normalizePublishMethod(normalized[0])
    if (isPublishMethod(first)) {
        return {
            method: first,
            platforms: filterPublishPlatformValues(normalized.slice(1)),
        }
    }

    return {
        method: null,
        platforms: filterPublishPlatformValues(normalized),
    }
}

/** 将发布弹窗选项写入 ppconfig。 */
export function applyPublishToPpConfig(
    base: PpConfig,
    values: PublishFormValues,
): PpConfig {
    const config = structuredClone(base) as PpConfig
    config.platform = buildPlatformArray(values.method, values.platforms)
    config.devbug = values.debug
    config.desc = values.description.trim()
    config.desktop.buildMethod = values.method
    config.desktop.debug = values.debug
    config.desktop.pubBody = values.description.trim()
    return config
}

/** 将移动端发布弹窗选项写入 ppconfig。 */
export function applyMobilePublishToPpConfig(
    base: PpConfig,
    values: Pick<PublishFormValues, 'platforms' | 'debug' | 'description'>,
): PpConfig {
    const config = structuredClone(base) as PpConfig
    const description = values.description.trim()
    config.platform = buildMobilePlatformArray(values.platforms)
    config.devbug = values.debug
    config.desc = description
    config.ios.debug = values.debug
    config.android.debug = values.debug
    config.ios.pubBody = description
    config.android.pubBody = description
    return config
}

export function mobilePublishInitialValuesFromPpConfig(
    config: PpConfig,
): Pick<PublishFormValues, 'platforms' | 'debug' | 'description'> {
    const platforms = filterMobilePlatformValues(config.platform)
    const description =
        config.desc.trim() ||
        config.ios.pubBody.trim() ||
        config.android.pubBody.trim()
    return {
        platforms:
            platforms.length > 0
                ? [platforms[0]]
                : [...DEFAULT_MOBILE_PUBLISH_DIALOG_PLATFORMS],
        debug: config.devbug || config.ios.debug || config.android.debug,
        description,
    }
}

export function publishInitialValuesFromPpConfig(
    config: PpConfig,
): PublishFormValues {
    const { method: methodFromPlatform, platforms } = parsePlatformArray(
        config.platform,
    )
    const buildMethod = normalizePublishMethod(config.desktop.buildMethod)
    const method =
        methodFromPlatform ??
        (buildMethod === PUBLISH_METHOD_LOCAL
            ? PUBLISH_METHOD_LOCAL
            : buildMethod === PUBLISH_METHOD_ELECTRON
              ? PUBLISH_METHOD_ELECTRON
              : PUBLISH_METHOD_CLOUD)
    const resolvedPlatforms =
        platforms.length > 0 ? platforms : [...DEFAULT_PUBLISH_PLATFORMS]
    const description =
        config.desc.trim() ||
        config.desktop.pubBody.trim() ||
        config.ios.desc.trim()
    return {
        method,
        platforms: resolvedPlatforms,
        debug: config.devbug || config.desktop.debug,
        description,
    }
}

export function applyFormToPpConfig(
    base: PpConfig,
    fields: PpConfigFormFields,
): PpConfig {
    const config = structuredClone(base) as PpConfig
    const name = fields.name.trim()
    const showName = fields.showName.trim()
    const url = fields.url.trim()
    const appId = fields.app_id.trim()
    const version = fields.version.trim() || '1.0.0'
    const icon = fields.icon.trim()

    config.name = name
    config.showName = showName
    config.url = url
    config.appid = appId
    config.version = version
    config.icon = icon
    if (icon) {
        config.iconPath = icon
    }

    config.state = fields.keepWindow
    config.single = fields.singleton
    config.desktop.state = fields.keepWindow
    config.desktop.single = fields.singleton

    syncPlatformFields(config, {
        name,
        showName,
        url,
        app_id: appId,
        version,
        icon,
    })
    return config
}

/** 随机 8 位小写英文字母 + 用户 id，用作应用内部 name 标识。 */
export function generateRandomAppName(
    userId: number | string,
    length = 8,
): string {
    const bytes = new Uint8Array(length)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes)
    } else {
        for (let i = 0; i < length; i++) {
            bytes[i] = Math.floor(Math.random() * 256)
        }
    }
    const randomPart = Array.from(
        bytes,
        (byte) => APP_NAME_ALPHABET[byte % APP_NAME_ALPHABET.length],
    ).join('')
    return `${randomPart}${userId}`
}

/** 新建项目 APP ID：com.{内部 name}.taurihub */
export function buildAppId(internalName: string): string {
    return `com.${internalName}.taurihub`
}

/** 基于 ppconfig 模板生成新建应用的默认 config。 */
export function buildDefaultPpConfig(
    showName: string,
    internalName: string,
): PpConfig {
    const config = structuredClone(ppconfigTemplate) as PpConfig
    const appId = buildAppId(internalName)
    config.name = internalName
    config.showName = showName.trim()
    config.appid = appId
    config.ios.id = appId
    config.android.id = appId
    config.desktop.id = appId
    return config
}

export function buildCreateProjectPayload(
    showName: string,
    userId: number | string,
): {
    name: string
    show_name: string
    app_id: string
    config: PpConfig
} {
    const trimmed = showName.trim()
    const internalName = generateRandomAppName(userId)
    const app_id = buildAppId(internalName)
    return {
        name: internalName,
        show_name: trimmed,
        app_id,
        config: buildDefaultPpConfig(trimmed, internalName),
    }
}
