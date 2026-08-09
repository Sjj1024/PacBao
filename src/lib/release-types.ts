export type AppReleaseType =
    | 'android'
    | 'ios'
    | 'iosclip'
    | 'windows'
    | 'macos'
    | 'linux'
    | 'web'
    | string

export type AppRelease = {
    id: string
    projectId: string
    name: string
    downloadUrl: string
    appType: AppReleaseType
    sizeBytes: number
    publishedAt: number
}

export type AppReleaseTypeLabels = Record<string, string>
