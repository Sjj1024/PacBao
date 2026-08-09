import type { AppRelease } from '@/lib/release-types'

export class ReleaseApiError extends Error {
    code?: number

    constructor(message: string, code?: number) {
        super(message)
        this.name = 'ReleaseApiError'
        this.code = code
    }
}

const MOCK_RELEASES: AppRelease[] = [
    {
        id: 'mock-release-1',
        projectId: '0',
        name: 'Demo-1.0.0-setup.exe',
        downloadUrl: '#',
        appType: 'windows',
        sizeBytes: 42_000_000,
        publishedAt: Date.now() - 86_400_000,
    },
    {
        id: 'mock-release-2',
        projectId: '0',
        name: 'Demo-1.0.0.apk',
        downloadUrl: '#',
        appType: 'android',
        sizeBytes: 18_500_000,
        publishedAt: Date.now() - 172_800_000,
    },
]

/** UI-only stub: returns static mock releases. */
export async function listAppReleases(projectId: string): Promise<AppRelease[]> {
    await Promise.resolve()
    return MOCK_RELEASES.map((r) => ({ ...r, projectId }))
}

/** UI-only stub: no-op. */
export async function deleteAppRelease(
    _projectId: string,
    _releaseId: string,
): Promise<void> {
    await Promise.resolve()
}
