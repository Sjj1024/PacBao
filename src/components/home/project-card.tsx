'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { APP_ICON_PLACEHOLDER_SRC } from '@/lib/app-icon-render'
import { appDetailHref } from '@/lib/app-detail-route'
import { toIconSrc } from '@/lib/file-api'
import type { Project } from '@/stores/project-store'
import {
    projectCardDescClass,
    projectCardIconAreaClass,
    projectCardOuterClass,
    projectCardTitleClass,
} from './project-card-styles'

export type ProjectCardLabels = {
    editProject: string
    deleteProject: string
}

type MenuState = {
    x: number
    y: number
}

type ProjectCardProps = {
    project: Project
    labels: ProjectCardLabels
    onEdit: (project: Project) => void
    onDelete: (project: Project) => void
}

export function ProjectCard({
    project,
    labels,
    onEdit,
    onDelete,
}: ProjectCardProps) {
    const displayName = project.show_name || project.app_id
    const displayDesc = project.url || project.description
    const iconSrc = toIconSrc(project.icon) || APP_ICON_PLACEHOLDER_SRC
    const [menu, setMenu] = useState<MenuState | null>(null)

    function closeMenu() {
        setMenu(null)
    }

    function handleContextMenu(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        setMenu({ x: e.clientX, y: e.clientY })
    }

    return (
        <>
            <Link
                href={appDetailHref(project.id)}
                className={`${projectCardOuterClass} cursor-pointer border-zinc-200 bg-white transition-[border-color,box-shadow] hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:hover:border-zinc-700`}
                onContextMenu={handleContextMenu}
            >
                <div className={`${projectCardIconAreaClass} border-zinc-200`}>
                    <img
                        src={iconSrc}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                </div>
                <h2 className={projectCardTitleClass}>{displayName}</h2>
                <p className={projectCardDescClass}>{displayDesc}</p>
                <div className="min-h-0 flex-1" aria-hidden />
            </Link>

            {menu ? (
                <ProjectContextMenu
                    x={menu.x}
                    y={menu.y}
                    editLabel={labels.editProject}
                    deleteLabel={labels.deleteProject}
                    onClose={closeMenu}
                    onEdit={() => {
                        closeMenu()
                        onEdit(project)
                    }}
                    onDelete={() => {
                        closeMenu()
                        onDelete(project)
                    }}
                />
            ) : null}
        </>
    )
}

function ProjectContextMenu({
    x,
    y,
    editLabel,
    deleteLabel,
    onClose,
    onEdit,
    onDelete,
}: {
    x: number
    y: number
    editLabel: string
    deleteLabel: string
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
}) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState({ left: x, top: y })

    useLayoutEffect(() => {
        const el = menuRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const pad = 8
        const left = Math.min(
            Math.max(pad, x),
            window.innerWidth - rect.width - pad
        )
        const top = Math.min(
            Math.max(pad, y),
            window.innerHeight - rect.height - pad
        )
        setPos({ left, top })
    }, [x, y])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        const onPointer = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) onClose()
        }
        const onScroll = () => onClose()
        document.addEventListener('keydown', onKey)
        document.addEventListener('mousedown', onPointer)
        window.addEventListener('scroll', onScroll, true)
        return () => {
            document.removeEventListener('keydown', onKey)
            document.removeEventListener('mousedown', onPointer)
            window.removeEventListener('scroll', onScroll, true)
        }
    }, [onClose])

    return createPortal(
        <div
            ref={menuRef}
            role="menu"
            className="fixed z-100 min-w-[10.5rem] overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            style={{ left: pos.left, top: pos.top }}
        >
            <button
                type="button"
                role="menuitem"
                className="flex w-full px-3.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                onClick={onEdit}
            >
                {editLabel}
            </button>
            <button
                type="button"
                role="menuitem"
                className="flex w-full px-3.5 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                onClick={onDelete}
            >
                {deleteLabel}
            </button>
        </div>,
        document.body
    )
}
