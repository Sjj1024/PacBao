import type { PpConfig } from '@/lib/ppconfig'

export type ProjectStatus = 'normal' | 'publishing' | 'banned' | 'deleted'

export type ApiProject = {
    id: number
    name: string
    show_name?: string
    app_id?: string
    version?: string
    description: string
    url: string
    icon: string
    config?: PpConfig
    status?: ProjectStatus
    createdAt: number
    updatedAt: number
}

export type ListProjectsParams = {
    page?: number
    limit?: number
    user_id?: number
    status?: ProjectStatus
}

export type ListProjectsResponse = {
    list: ApiProject[]
    total: number
}

export type CreateProjectParams = {
    name: string
    show_name?: string
    app_id?: string
    description?: string
    url?: string
    icon?: string
    config?: string | Record<string, unknown>
    download_links?: string | Record<string, unknown>
    status?: ProjectStatus
}

export type CreateProjectResponse = {
    success: true
    id: number
}

export type UpdateProjectParams = {
    id: number
    name?: string
    show_name?: string
    app_id?: string
    version?: string
    description?: string
    url?: string
    icon?: string
    config?: string | Record<string, unknown>
    download_links?: string | Record<string, unknown>
    status?: ProjectStatus
}

export type UpdateProjectResponse = {
    success: true
}

export type DeleteProjectResponse = {
    success: true
}

export type ProjectErrorBody = {
    success?: false
    message?: string
}

/** Legacy packager Tauri project shape (kept for pack-api; not used by UI). */
export type ProjectSummary = {
    id: string
    name: string
    url: string
    description?: string
    iconPath?: string | null
    updatedAt: number
}

export type AppProject = {
    id: string
    name: string
    url: string
    packageId: string
    version: string
    description: string
    iconPath: string | null
    roundIcon: boolean
    network: boolean
    download: boolean
    debug: boolean
    windowPersist: boolean
    singleton: boolean
    windowMode: string
    windowWidth: number
    windowHeight: number
    safeArea: string
    orientation: string
    webClipFullScreen: boolean
    webClipRemovable: boolean
    webClipOrganization: string
    webClipDescription: string
    injectJs: string
    createdAt: number
    updatedAt: number
}
