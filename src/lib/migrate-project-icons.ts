import { isTauri } from '@tauri-apps/api/core'
import { isDataUrl, resolveIconPair } from '@/lib/file-api'
import { useProjectStore, type Project } from '@/stores/project-store'

/**
 * Move any data-URL icons still in the project store onto disk so localStorage
 * only keeps short filesystem paths.
 */
export async function migrateProjectIconsToDisk(): Promise<void> {
    if (!isTauri()) return

    const { projects, setProjects } = useProjectStore.getState()
    if (!projects.some((p) => isDataUrl(p.icon) || isDataUrl(p.iconSource))) {
        return
    }

    const next: Project[] = []
    let changed = false

    for (const project of projects) {
        if (!isDataUrl(project.icon) && !isDataUrl(project.iconSource)) {
            next.push(project)
            continue
        }
        try {
            const folder = `migrated/${project.id}`
            const { icon, iconSource } = await resolveIconPair(
                project.icon,
                project.iconSource,
                folder,
            )
            changed = true
            next.push({ ...project, icon, iconSource })
        } catch (err) {
            console.error('migrate project icon failed', project.id, err)
            next.push(project)
        }
    }

    if (changed) setProjects(next)
}
