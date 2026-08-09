import type { BuildTaskPayload } from '@/lib/ppconfig'

export class BuildTaskApiError extends Error {
    code?: number

    constructor(message: string, code?: number) {
        super(message)
        this.name = 'BuildTaskApiError'
        this.code = code
    }
}

export type BuildTaskArtifact = {
    name: string
    size: number
    created_at: string
    browser_download_url: string
}

export type BuildTaskDetail = {
    id: number
    pro_id: number
    name: string
    publish: string
    worker_name?: string
    worker_dir?: string
    windows: BuildTaskArtifact[] | string
    electron: BuildTaskArtifact[] | string
    ios: BuildTaskArtifact[] | string
    android: BuildTaskArtifact[] | string
    iosclip: BuildTaskArtifact[] | string
    config?: string
    status?: string
    created_at?: string
    updated_at?: string
}

type CreateBuildTaskResponse = {
    success: true
}

function mockDetail(proId: number): BuildTaskDetail {
    const now = new Date().toISOString()
    return {
        id: 1,
        pro_id: proId,
        name: 'Demo',
        publish: 'windows',
        windows: [
            {
                name: 'Demo-1.0.0-setup.exe',
                size: 42_000_000,
                created_at: now,
                browser_download_url: '#',
            },
        ],
        electron: [],
        ios: [],
        android: [
            {
                name: 'Demo-1.0.0.apk',
                size: 18_500_000,
                created_at: now,
                browser_download_url: '#',
            },
        ],
        iosclip: [],
        status: 'done',
        created_at: now,
        updated_at: now,
    }
}

/** UI-only stub: pretend publish succeeded. */
export async function createBuildTask(
    _payload: BuildTaskPayload,
): Promise<CreateBuildTaskResponse> {
    await Promise.resolve()
    console.info('[stub] createBuildTask')
    return { success: true }
}

/** UI-only stub: returns mock release artifacts. */
export async function getBuildTaskDetail(
    proId: number,
): Promise<BuildTaskDetail | null> {
    await Promise.resolve()
    if (!Number.isFinite(proId) || proId <= 0) {
        return mockDetail(1)
    }
    return mockDetail(proId)
}
