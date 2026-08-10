'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { AddProjectCard } from '@/components/home/add-project-card'
import { CreateProjectDialog } from '@/components/home/create-project-dialog'
import { HomeHeader } from '@/components/home/home-header'
import { ProjectCard } from '@/components/home/project-card'
import { MessageDialog } from '@/components/message-dialog'
import { PageShell } from '@/components/layout/page-shell'
import { useAuthUser } from '@/hooks/use-auth-user'
import { getAuthUser } from '@/lib/auth-token'
import {
    createProject,
    deleteProject,
    listProjects,
    ProjectApiError,
} from '@/lib/project-api'
import { appDetailHref } from '@/lib/app-detail-route'
import { buildCreateProjectPayload } from '@/lib/ppconfig'
import { migrateProjectIconsToDisk } from '@/lib/migrate-project-icons'
import { HOME_STRINGS } from '@/locales/home'
import {
    selectLocale,
    selectSetLocale,
    useLocaleStore,
} from '@/stores/locale-store'
import {
    mergeProjectFromApi,
    selectDeleteProject,
    selectProjects,
    selectSetProjects,
    useProjectStore,
    type Project,
} from '@/stores/project-store'
import {
    selectColorScheme,
    selectToggleColorScheme,
    useThemeStore,
} from '@/stores/theme-store'

export function HomePageClient() {
    const router = useRouter()
    const locale = useLocaleStore(selectLocale)
    const setLocale = useLocaleStore(selectSetLocale)
    const colorScheme = useThemeStore(selectColorScheme)
    const toggleColorScheme = useThemeStore(selectToggleColorScheme)
    const projects = useProjectStore(selectProjects)
    const setProjects = useProjectStore(selectSetProjects)
    const removeProjectFromStore = useProjectStore(selectDeleteProject)
    const t = HOME_STRINGS[locale]

    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [creatingProject, setCreatingProject] = useState(false)
    const [createProjectError, setCreateProjectError] = useState('')
    const [projectsLoadError, setProjectsLoadError] = useState('')
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteAlert, setDeleteAlert] = useState<{
        open: boolean
        message: string
    }>({ open: false, message: '' })
    const { user: authUser } = useAuthUser()

    const loadProjects = useCallback(async () => {
        setProjectsLoadError('')
        const silent = useProjectStore.getState().projects.length > 0
        try {
            const existingById = new Map(
                useProjectStore.getState().projects.map((p) => [p.id, p]),
            )
            const { list } = await listProjects({}, { silent })
            setProjects(
                list.map((item) =>
                    mergeProjectFromApi(
                        item,
                        existingById.get(String(item.id)),
                    ),
                ),
            )
            await migrateProjectIconsToDisk()
        } catch (err) {
            console.error('loadProjects failed', err)
            setProjectsLoadError(
                err instanceof ProjectApiError
                    ? err.message
                    : err instanceof Error && err.message
                      ? err.message
                      : t.loadProjectsFailed,
            )
        }
    }, [setProjects, t.loadProjectsFailed])

    useEffect(() => {
        const persistApi = useProjectStore.persist
        if (!persistApi) {
            void loadProjects()
            return
        }

        const run = () => {
            void loadProjects()
        }
        if (persistApi.hasHydrated()) {
            run()
            return
        }
        return persistApi.onFinishHydration(run)
    }, [loadProjects])

    function handleAddProjectClick() {
        setCreateProjectError('')
        setCreateDialogOpen(true)
    }

    async function handleCreateProject(name: string) {
        setCreatingProject(true)
        setCreateProjectError('')

        try {
            const userId = getAuthUser()?.id ?? authUser?.id ?? 1
            const payload = buildCreateProjectPayload(name, userId)
            const { id } = await createProject({
                name: payload.name,
                show_name: payload.show_name,
                app_id: payload.app_id,
                config: payload.config,
            })
            setCreateDialogOpen(false)
            router.push(appDetailHref(String(id)))
        } catch (err) {
            setCreateProjectError(
                err instanceof ProjectApiError
                    ? err.message
                    : t.createProjectFailed,
            )
        } finally {
            setCreatingProject(false)
        }
    }

    function handleEditProject(project: Project) {
        router.push(appDetailHref(project.id))
    }

    function handleRequestDelete(project: Project) {
        setDeleteTarget(project)
    }

    async function confirmDeleteProject() {
        if (!deleteTarget || isDeleting) return
        setIsDeleting(true)
        try {
            await deleteProject(deleteTarget.id)
            removeProjectFromStore(deleteTarget.id)
            setDeleteTarget(null)
        } catch (err) {
            setDeleteTarget(null)
            setDeleteAlert({
                open: true,
                message:
                    err instanceof ProjectApiError
                        ? err.message
                        : err instanceof Error && err.message
                          ? err.message
                          : t.deleteProjectFailed,
            })
        } finally {
            setIsDeleting(false)
        }
    }

    function handleSettingsClick() {
        router.push('/account/profile/')
    }

    useEffect(() => {
        const htmlLang =
            locale === 'zh-TW'
                ? 'zh-Hant'
                : locale === 'zh-CN'
                  ? 'zh-CN'
                  : locale
        document.documentElement.lang = htmlLang
    }, [locale])

    useEffect(() => {
        return () => {
            document.documentElement.lang = 'zh-CN'
        }
    }, [])

    return (
        <PageShell>
            <HomeHeader
                t={t}
                locale={locale}
                setLocale={setLocale}
                colorScheme={colorScheme}
                toggleColorScheme={toggleColorScheme}
                authUser={authUser}
                onSettingsClick={handleSettingsClick}
            />

            <section className="min-h-0 flex-1 overflow-y-auto pb-1 px-1 overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] content-start gap-4 sm:gap-6">
                    {projectsLoadError ? (
                        <div className="col-span-full flex flex-col items-center gap-3 py-6">
                            <p
                                className="text-center text-sm text-red-600 dark:text-red-400"
                                role="alert"
                            >
                                {projectsLoadError}
                            </p>
                            <button
                                type="button"
                                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                onClick={() => void loadProjects()}
                            >
                                {t.retry}
                            </button>
                        </div>
                    ) : null}

                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            labels={{
                                editProject: t.editProject,
                                deleteProject: t.deleteProject,
                            }}
                            onEdit={handleEditProject}
                            onDelete={handleRequestDelete}
                        />
                    ))}

                    <AddProjectCard
                        label={t.addProject}
                        onClick={handleAddProjectClick}
                    />
                </div>
            </section>

            <CreateProjectDialog
                key={createDialogOpen ? 'open' : 'closed'}
                open={createDialogOpen}
                title={t.createProjectTitle}
                nameLabel={t.projectNameLabel}
                namePlaceholder={t.projectNamePlaceholder}
                cancelLabel={t.cancel}
                confirmLabel={creatingProject ? t.creating : t.confirm}
                nameRequiredError={t.projectNameRequired}
                submitting={creatingProject}
                submitError={createProjectError}
                onClose={() => {
                    if (creatingProject) return
                    setCreateDialogOpen(false)
                }}
                onConfirm={handleCreateProject}
            />

            <MessageDialog
                open={Boolean(deleteTarget)}
                title={t.deleteProject}
                message={t.deleteProjectConfirm}
                cancelLabel={t.cancel}
                confirmLabel={isDeleting ? t.deleting : t.confirm}
                confirmDanger
                loading={isDeleting}
                onClose={() => {
                    if (isDeleting) return
                    setDeleteTarget(null)
                }}
                onConfirm={() => void confirmDeleteProject()}
            />

            <MessageDialog
                open={deleteAlert.open}
                message={deleteAlert.message}
                confirmLabel={t.confirm}
                onClose={() => setDeleteAlert({ open: false, message: '' })}
                onConfirm={() => setDeleteAlert({ open: false, message: '' })}
            />
        </PageShell>
    )
}
