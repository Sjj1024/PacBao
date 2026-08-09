'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { headerIconButtonClass } from '@/components/home/header-actions'

export type DetailSection =
    | 'basic'
    | 'mobile'
    | 'desktop-settings'
    | 'phone-config'
    | 'script-editor'
    | 'startup-config'
    | 'release-history'
    | 'faq'
    | 'capability-demo'

export type MoreMenuAction =
    | 'desktop-config'
    | 'desktop-settings'
    | 'phone-config'
    | 'script-editor'
    | 'startup-config'
    | 'release-history'
    | 'delete-project'
    | 'faq'
    | 'capability-demo'

export type MoreMenuLabels = {
    publish: string
    desktopConfig: string
    desktopSettings: string
    phoneConfig: string
    scriptEditor: string
    startupConfig: string
    releaseHistory: string
    deleteProject: string
    faq: string
    capabilityDemo: string
    triggerAria: string
}

function IconMenu({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
    )
}

function IconPlay({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M8 5.14v13.72c0 .79.87 1.27 1.54.84l11.06-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z" />
        </svg>
    )
}

function IconSend({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
            <path d="m21.854 2.147-10.94 10.939" />
        </svg>
    )
}

function IconSliders({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
            <path d="M2 14h4M10 8h4M18 16h4" />
        </svg>
    )
}

const menuItemClass =
    'block w-full px-3 py-2.5 text-center text-[15px] leading-snug text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800'

const menuItemDangerClass =
    'block w-full px-3 py-2.5 text-center text-[15px] leading-snug text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'

function MoreConfigDropdown({
    open,
    labels,
    onToggle,
    onClose,
    onSelect,
    dropdownAlign = 'right',
}: {
    open: boolean
    labels: MoreMenuLabels
    onToggle: () => void
    onClose: () => void
    onSelect: (action: MoreMenuAction) => void
    dropdownAlign?: 'left' | 'right'
}) {
    const rootRef = useRef<HTMLDivElement>(null)
    const items: { action: MoreMenuAction; label: string; danger?: boolean }[] =
        [
            { action: 'desktop-config', label: labels.desktopConfig },
            { action: 'desktop-settings', label: labels.desktopSettings },
            { action: 'phone-config', label: labels.phoneConfig },
            { action: 'script-editor', label: labels.scriptEditor },
            { action: 'startup-config', label: labels.startupConfig },
            { action: 'release-history', label: labels.releaseHistory },
            {
                action: 'delete-project',
                label: labels.deleteProject,
                danger: true,
            },
            { action: 'faq', label: labels.faq },
            { action: 'capability-demo', label: labels.capabilityDemo },
        ]

    useEffect(() => {
        if (!open) return
        const onPointer = (e: MouseEvent | TouchEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) onClose()
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('mousedown', onPointer)
        document.addEventListener('touchstart', onPointer)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onPointer)
            document.removeEventListener('touchstart', onPointer)
            document.removeEventListener('keydown', onKey)
        }
    }, [open, onClose])

    function handleSelect(action: MoreMenuAction) {
        onSelect(action)
        onClose()
    }

    return (
        <div className="relative inline-flex" ref={rootRef}>
            <button
                type="button"
                className={headerIconButtonClass(open)}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label={labels.triggerAria}
                onClick={onToggle}
            >
                <IconSliders className="h-5 w-5" />
            </button>
            {open ? (
                <div
                    role="menu"
                    className={`absolute z-40 mt-2 w-32 overflow-hidden rounded-xl bg-white py-1 shadow-[0_8px_28px_rgba(0,0,0,0.12)] dark:bg-zinc-900 dark:shadow-[0_8px_28px_rgba(0,0,0,0.45)] ${
                        dropdownAlign === 'right' ? 'right-0' : 'left-0'
                    }`}
                >
                    {items.map((item) => (
                        <button
                            key={item.action}
                            type="button"
                            role="menuitem"
                            className={
                                item.danger
                                    ? menuItemDangerClass
                                    : menuItemClass
                            }
                            onClick={() => handleSelect(item.action)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

type AppDetailHeaderProps = {
    title: string
    subtitle: ReactNode
    activeSection: DetailSection
    mobileAriaLabel: string
    moreMenuLabels: MoreMenuLabels
    menuAria: string
    onMobileClick: () => void
    onPublishClick: () => void
    onMoreMenuSelect: (action: MoreMenuAction) => void
    onTitleClick: () => void
}

export function AppDetailHeader({
    title,
    subtitle,
    activeSection,
    mobileAriaLabel,
    moreMenuLabels,
    menuAria,
    onMobileClick,
    onPublishClick,
    onMoreMenuSelect,
    onTitleClick,
}: AppDetailHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [moreMenuOpen, setMoreMenuOpen] = useState(false)
    const mobileMenuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!mobileMenuOpen) return
        const onPointer = (e: MouseEvent | TouchEvent) => {
            if (!mobileMenuRef.current?.contains(e.target as Node)) {
                setMobileMenuOpen(false)
                setMoreMenuOpen(false)
            }
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMobileMenuOpen(false)
                setMoreMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', onPointer)
        document.addEventListener('touchstart', onPointer)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onPointer)
            document.removeEventListener('touchstart', onPointer)
            document.removeEventListener('keydown', onKey)
        }
    }, [mobileMenuOpen])

    function handleMobileClick() {
        onMobileClick()
        setMobileMenuOpen(false)
    }

    function handlePublishClick() {
        onPublishClick()
        setMobileMenuOpen(false)
    }

    const closeMoreMenu = useCallback(() => {
        setMoreMenuOpen(false)
    }, [])

    return (
        <header className="mb-4 shrink-0 px-1">
            <div className="flex flex-row items-start justify-between gap-4 md:items-center">
                <div className="min-w-0 flex-1 pr-2">
                    <button
                        type="button"
                        className="text-left"
                        onClick={onTitleClick}
                    >
                        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
                            {title}
                        </h2>
                    </button>
                    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
                        {subtitle}
                    </p>
                </div>

                <div className="relative shrink-0 md:hidden" ref={mobileMenuRef}>
                    <button
                        type="button"
                        className={headerIconButtonClass(mobileMenuOpen)}
                        aria-expanded={mobileMenuOpen}
                        aria-haspopup="true"
                        aria-label={menuAria}
                        onClick={() => {
                            setMoreMenuOpen(false)
                            setMobileMenuOpen((open) => !open)
                        }}
                    >
                        <IconMenu className="h-5 w-5" />
                    </button>
                    {mobileMenuOpen ? (
                        <div
                            className="absolute right-0 z-30 mt-2 w-fit rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                            role="menu"
                        >
                            <div className="flex w-fit flex-col gap-2">
                                <button
                                    type="button"
                                    role="menuitem"
                                    className={headerIconButtonClass(
                                        activeSection === 'mobile',
                                    )}
                                    aria-label={mobileAriaLabel}
                                    aria-current={
                                        activeSection === 'mobile'
                                            ? 'page'
                                            : undefined
                                    }
                                    onClick={handleMobileClick}
                                >
                                    <IconPlay className="h-5 w-5" />
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    className={headerIconButtonClass(false)}
                                    aria-label={moreMenuLabels.publish}
                                    onClick={handlePublishClick}
                                >
                                    <IconSend className="h-5 w-5" />
                                </button>
                                <MoreConfigDropdown
                                    open={moreMenuOpen}
                                    labels={moreMenuLabels}
                                    dropdownAlign="right"
                                    onToggle={() =>
                                        setMoreMenuOpen((open) => !open)
                                    }
                                    onClose={closeMoreMenu}
                                    onSelect={onMoreMenuSelect}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="hidden shrink-0 items-center gap-2 md:flex">
                    <button
                        type="button"
                        className={headerIconButtonClass(
                            activeSection === 'mobile',
                        )}
                        aria-label={mobileAriaLabel}
                        aria-current={
                            activeSection === 'mobile' ? 'page' : undefined
                        }
                        onClick={onMobileClick}
                    >
                        <IconPlay className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        className={headerIconButtonClass(false)}
                        aria-label={moreMenuLabels.publish}
                        title={moreMenuLabels.publish}
                        onClick={onPublishClick}
                    >
                        <IconSend className="h-5 w-5" />
                    </button>
                    <MoreConfigDropdown
                        open={moreMenuOpen}
                        labels={moreMenuLabels}
                        onToggle={() => {
                            setMobileMenuOpen(false)
                            setMoreMenuOpen((open) => !open)
                        }}
                        onClose={closeMoreMenu}
                        onSelect={onMoreMenuSelect}
                    />
                </div>
            </div>
        </header>
    )
}
