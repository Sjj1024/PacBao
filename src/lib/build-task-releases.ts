import type { BuildTaskArtifact, BuildTaskDetail } from '@/lib/build-task-api'
import type { AppRelease, AppReleaseType } from '@/lib/release-types'

const RELEASE_SECTIONS = [
    'windows',
    'electron',
    'ios',
    'android',
    'iosclip',
] as const

type ReleaseSection = (typeof RELEASE_SECTIONS)[number]

function parseArtifactTimestamp(value: string): number {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : 0
}

function normalizeArtifacts(value: unknown): BuildTaskArtifact[] {
    if (!Array.isArray(value)) return []
    return value.filter(
        (item): item is BuildTaskArtifact =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as BuildTaskArtifact).name === 'string' &&
            typeof (item as BuildTaskArtifact).browser_download_url === 'string',
    )
}

function inferDesktopAppType(filename: string): AppReleaseType {
    const lower = filename.toLowerCase()
    if (lower.endsWith('.apk')) return 'android'
    if (lower.endsWith('.ipa')) return 'ios'
    if (lower.endsWith('.exe') || lower.endsWith('.msi')) return 'windows'
    if (
        lower.endsWith('.dmg') ||
        lower.endsWith('.app.tar.gz') ||
        lower.includes('macos')
    ) {
        return 'macos'
    }
    if (
        lower.endsWith('.appimage') ||
        lower.endsWith('.deb') ||
        lower.includes('linux')
    ) {
        return 'linux'
    }
    if (lower.includes('win') || lower.includes('setup')) return 'windows'
    return 'windows'
}

function resolveAppType(section: ReleaseSection, filename: string): AppReleaseType {
    if (section === 'ios') return 'ios'
    if (section === 'android') return 'android'
    if (section === 'iosclip') return 'iosclip'
    return inferDesktopAppType(filename)
}

function artifactToRelease(
    projectId: string,
    section: ReleaseSection,
    artifact: BuildTaskArtifact,
    index: number,
): AppRelease {
    const downloadUrl = artifact.browser_download_url.trim()
    return {
        id: `${projectId}-${section}-${index}-${artifact.name}`,
        projectId,
        name: artifact.name.trim(),
        downloadUrl,
        appType: resolveAppType(section, artifact.name),
        sizeBytes:
            typeof artifact.size === 'number' && artifact.size >= 0
                ? artifact.size
                : 0,
        publishedAt: parseArtifactTimestamp(artifact.created_at),
    }
}

/** 将 buildTasks/detail 响应转为发布历史列表。 */
export function mapBuildTaskDetailToReleases(
    projectId: string,
    detail: BuildTaskDetail,
): AppRelease[] {
    const releases: AppRelease[] = []

    for (const section of RELEASE_SECTIONS) {
        const artifacts = normalizeArtifacts(detail[section])
        artifacts.forEach((artifact, index) => {
            releases.push(artifactToRelease(projectId, section, artifact, index))
        })
    }

    return releases.sort((a, b) => b.publishedAt - a.publishedAt)
}
