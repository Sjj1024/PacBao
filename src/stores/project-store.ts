'use client'

import { createId } from '@/lib/create-id'
import type { PpConfig } from '@/lib/ppconfig'
import type { ApiProject } from '@/lib/project-types'
import {
    DEFAULT_ICON_BORDER_RADIUS,
    getDefaultIconTransform,
    type IconTransform,
} from '@/lib/app-icon-render'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Project = {
    id: string
    /** API `name` field: internal app id (8-char random string). */
    internalName?: string
    show_name: string
    app_id: string
    url: string
    version: string
    icon: string
    iconSource: string
    iconBorderRadius: number
    iconTransform: IconTransform
    description: string
    ppConfig?: PpConfig
    createdAt: number
    updatedAt: number
}

type LegacyProject = {
    id: string
    name: string
    description: string
    createdAt: number
}

type PersistedProjectState = {
    projects: Project[]
}

type ProjectState = {
    projects: Project[]
    setProjects: (projects: Project[]) => void
    upsertProject: (project: Project) => void
    addProject: (
        name: string,
        description: string,
        id?: string | number
    ) => void
    updateProject: (
        id: string,
        patch: Partial<Omit<Project, 'id' | 'createdAt'>>
    ) => void
    deleteProject: (id: string) => void
}

function createProjectRecord(
    name: string,
    description: string,
    id?: string | number
): Project {
    const now = Date.now()
    return {
        id: id !== undefined ? String(id) : createId(),
        internalName: name,
        show_name: name,
        app_id: name,
        url: '',
        version: '1.0.0',
        icon: '',
        iconSource: '',
        iconBorderRadius: DEFAULT_ICON_BORDER_RADIUS,
        iconTransform: getDefaultIconTransform(),
        description,
        createdAt: now,
        updatedAt: now,
    }
}

/** Oldest createdAt first; new projects appear at the end of the list. */
export function sortProjectsOldestFirst(projects: Project[]): Project[] {
    return [...projects].sort((a, b) => {
        if (a.createdAt !== b.createdAt) {
            return a.createdAt - b.createdAt
        }
        const idA = Number(a.id)
        const idB = Number(b.id)
        if (Number.isFinite(idA) && Number.isFinite(idB)) {
            return idA - idB
        }
        return a.id.localeCompare(b.id)
    })
}

export function projectFromApi(item: ApiProject): Project {
    const displayName = item.show_name || item.name
    return {
        id: String(item.id),
        internalName: item.name,
        show_name: displayName,
        app_id: item.app_id || item.name,
        url: item.url,
        version: item.version || '1.0.0',
        icon: item.icon,
        iconSource: item.icon,
        iconBorderRadius: DEFAULT_ICON_BORDER_RADIUS,
        iconTransform: getDefaultIconTransform(),
        description: item.description,
        ppConfig: item.config,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }
}

export function mergeProjectFromApi(
    item: ApiProject,
    existing?: Project
): Project {
    const fromApi = projectFromApi(item)
    if (!existing) return fromApi
    return {
        ...fromApi,
        icon: fromApi.icon || existing.icon,
        iconSource: existing.iconSource || fromApi.icon,
        ppConfig: fromApi.ppConfig ?? existing.ppConfig,
        iconBorderRadius: existing.iconBorderRadius,
        iconTransform: existing.iconTransform,
    }
}

type LegacyProjectFields = Project & {
    appName?: string
    appId?: string
    websiteUrl?: string
}

function migrateProjectFieldNames(project: LegacyProjectFields): Project {
    if (
        'show_name' in project &&
        typeof project.show_name === 'string' &&
        'app_id' in project &&
        typeof project.app_id === 'string' &&
        'url' in project &&
        typeof project.url === 'string'
    ) {
        const { appName: _a, appId: _i, websiteUrl: _u, ...rest } = project
        return rest as Project
    }

    const {
        appName,
        appId,
        websiteUrl,
        show_name,
        app_id,
        url,
        ...rest
    } = project

    return {
        ...(rest as Omit<Project, 'show_name' | 'app_id' | 'url'>),
        show_name: show_name ?? appName ?? '',
        app_id: app_id ?? appId ?? '',
        url: url ?? websiteUrl ?? '',
    }
}

function migrateLegacyProject(project: LegacyProject | Project): Project {
    if ('show_name' in project || 'appId' in project || 'app_id' in project) {
        return migrateProjectFieldNames(project as LegacyProjectFields)
    }
    return {
        id: project.id,
        internalName: project.name,
        show_name: project.name,
        app_id: project.name,
        url: '',
        version: '1.0.0',
        icon: '',
        iconSource: '',
        iconBorderRadius: DEFAULT_ICON_BORDER_RADIUS,
        iconTransform: getDefaultIconTransform(),
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.createdAt,
    }
}

export const selectProjects = (s: ProjectState) => s.projects
export const selectSetProjects = (s: ProjectState) => s.setProjects
export const selectUpsertProject = (s: ProjectState) => s.upsertProject
export const selectAddProject = (s: ProjectState) => s.addProject
export const selectUpdateProject = (s: ProjectState) => s.updateProject
export const selectDeleteProject = (s: ProjectState) => s.deleteProject
export const selectProjectById = (id: string) => (s: ProjectState) =>
    s.projects.find((project) => project.id === id)

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            projects: [],
            setProjects: (projects) =>
                set({ projects: sortProjectsOldestFirst(projects) }),
            upsertProject: (project) =>
                set((state) => {
                    const index = state.projects.findIndex(
                        (item) => item.id === project.id
                    )
                    const projects =
                        index < 0
                            ? [...state.projects, project]
                            : state.projects.map((item, i) =>
                                  i === index ? project : item
                              )
                    return { projects: sortProjectsOldestFirst(projects) }
                }),
            addProject: (name, description, id) =>
                set((state) => ({
                    projects: sortProjectsOldestFirst([
                        ...state.projects,
                        createProjectRecord(name, description, id),
                    ]),
                })),
            updateProject: (id, patch) =>
                set((state) => ({
                    projects: state.projects.map((project) =>
                        project.id === id
                            ? {
                                  ...project,
                                  ...patch,
                                  updatedAt: Date.now(),
                              }
                            : project
                    ),
                })),
            deleteProject: (id) =>
                set((state) => ({
                    projects: state.projects.filter(
                        (project) => project.id !== id
                    ),
                })),
        }),
        {
            name: 'packager-desktop-projects',
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({ projects: s.projects }),
            version: 3,
            migrate: (persisted, version) => {
                let state = persisted as PersistedProjectState
                if (version === 0) {
                    const legacyProjects =
                        (state.projects as unknown as LegacyProject[]) ?? []
                    return {
                        projects: legacyProjects.map(migrateLegacyProject),
                    }
                }
                if (version === 1) {
                    state = {
                        projects: state.projects.map((project) => ({
                            ...project,
                            iconSource:
                                'iconSource' in project && project.iconSource
                                    ? project.iconSource
                                    : project.icon || '',
                            iconBorderRadius:
                                'iconBorderRadius' in project &&
                                typeof project.iconBorderRadius === 'number'
                                    ? project.iconBorderRadius
                                    : DEFAULT_ICON_BORDER_RADIUS,
                            iconTransform:
                                'iconTransform' in project &&
                                project.iconTransform
                                    ? project.iconTransform
                                    : getDefaultIconTransform(),
                        })),
                    }
                }
                if (version === 2) {
                    return {
                        projects: state.projects.map((project) =>
                            migrateProjectFieldNames(
                                project as LegacyProjectFields
                            )
                        ),
                    }
                }
                return state
            },
        }
    )
)
