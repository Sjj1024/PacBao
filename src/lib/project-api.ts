import { parsePpConfig } from '@/lib/ppconfig'
import type {
    ApiProject,
    CreateProjectParams,
    CreateProjectResponse,
    DeleteProjectResponse,
    ListProjectsParams,
    ListProjectsResponse,
    UpdateProjectParams,
    UpdateProjectResponse,
} from '@/lib/project-types'
import { useLoadingStore } from '@/stores/loading-store'
import {
    projectFromApi,
    useProjectStore,
} from '@/stores/project-store'

export class ProjectApiError extends Error {
    code?: number

    constructor(message: string, code?: number) {
        super(message)
        this.name = 'ProjectApiError'
        this.code = code
    }
}

type InvokeOptions = {
    silent?: boolean
}

async function withLoading<T>(
    fn: () => Promise<T>,
    options?: InvokeOptions,
): Promise<T> {
    const silent = options?.silent === true
    if (!silent) useLoadingStore.getState().start()
    try {
        return await fn()
    } finally {
        if (!silent) useLoadingStore.getState().stop()
    }
}

/** UI-only stub: reads local project store. */
export async function listProjects(
    _params: ListProjectsParams = {},
    options?: InvokeOptions,
): Promise<ListProjectsResponse> {
    return withLoading(async () => {
        const projects = useProjectStore.getState().projects
        const list = Array.isArray(projects)
            ? projects.map((p) => ({
                  id: Number(p.id) || 0,
                  name: p.internalName || p.show_name || p.app_id,
                  show_name: p.show_name,
                  app_id: p.app_id,
                  version: p.version,
                  description: p.description ?? '',
                  url: p.url ?? '',
                  icon: p.icon ?? '',
                  config: p.ppConfig,
                  status: 'normal' as const,
                  createdAt: p.createdAt ?? 0,
                  updatedAt: p.updatedAt ?? 0,
              }))
            : []
        return { list, total: list.length }
    }, options)
}

/** UI-only stub: reads local project store. */
export async function getProject(
    id: number | string,
    options?: InvokeOptions,
): Promise<ApiProject> {
    return withLoading(async () => {
        const key = String(id)
        const project = useProjectStore.getState().projects.find((p) => p.id === key)
        if (!project) throw new ProjectApiError('项目不存在', 404)
        return {
            id: Number(project.id) || 0,
            name: project.internalName || project.show_name,
            show_name: project.show_name,
            app_id: project.app_id,
            version: project.version,
            description: project.description,
            url: project.url,
            icon: project.icon,
            config: project.ppConfig,
            status: 'normal',
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        }
    }, options)
}

/** UI-only stub: writes to local project store. */
export async function createProject(
    params: CreateProjectParams,
    options?: InvokeOptions,
): Promise<CreateProjectResponse> {
    return withLoading(async () => {
        const id = Date.now()
        const config =
            typeof params.config === 'string'
                ? parsePpConfig(params.config) ?? undefined
                : (params.config as ReturnType<typeof parsePpConfig>) ??
                  undefined
        const apiProject: ApiProject = {
            id,
            name: params.name,
            show_name: params.show_name,
            app_id: params.app_id,
            description: params.description ?? '',
            url: params.url ?? '',
            icon: params.icon ?? '',
            config: config ?? undefined,
            status: 'normal',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
        useProjectStore.getState().upsertProject(projectFromApi(apiProject))
        return { success: true, id }
    }, options)
}

/** UI-only stub: updates local project store. */
export async function updateProject(
    params: UpdateProjectParams,
    options?: InvokeOptions,
): Promise<UpdateProjectResponse> {
    return withLoading(async () => {
        const key = String(params.id)
        const existing = useProjectStore.getState().projects.find((p) => p.id === key)
        if (!existing) throw new ProjectApiError('项目不存在', 404)

        const config =
            params.config === undefined
                ? existing.ppConfig
                : typeof params.config === 'string'
                  ? parsePpConfig(params.config) ?? existing.ppConfig
                  : (params.config as NonNullable<typeof existing.ppConfig>)

        useProjectStore.getState().updateProject(key, {
            internalName: params.name ?? existing.internalName,
            show_name: params.show_name ?? existing.show_name,
            app_id: params.app_id ?? existing.app_id,
            version: params.version ?? existing.version,
            description: params.description ?? existing.description,
            url: params.url ?? existing.url,
            icon: params.icon ?? existing.icon,
            ppConfig: config,
        })
        return { success: true }
    }, options)
}

/** UI-only stub: deletes from local project store. */
export async function deleteProject(
    id: number | string,
    options?: InvokeOptions,
): Promise<DeleteProjectResponse> {
    return withLoading(async () => {
        useProjectStore.getState().deleteProject(String(id))
        return { success: true }
    }, options)
}
