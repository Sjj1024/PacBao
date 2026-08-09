'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
    getAccountAbout,
    getAccountNavGroups,
    type AccountSectionId,
    slugToSection,
} from '@/lib/account-nav'
import { ACCOUNT_STRINGS } from '@/locales/account'
import { selectLocale, useLocaleStore } from '@/stores/locale-store'

function IconChevron({ open }: { open: boolean }) {
    return (
        <svg
            className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                open ? 'rotate-180' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}

function IconClose({ className }: { className?: string }) {
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
            aria-hidden
        >
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    )
}

function navLinkClass(active: boolean) {
    if (active) {
        return 'flex items-center gap-2.5 rounded-lg bg-zinc-100 px-3 py-2.5 text-[15px] font-medium leading-snug text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
    }
    return 'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] leading-snug text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
}

function initOpenGroups(): Record<string, boolean> {
    return { basic: true }
}

type AccountSidebarProps = {
    activeSection: AccountSectionId
    isTauri?: boolean
    onNavigate?: () => void
    onClose?: () => void
    className?: string
}

export function AccountSidebar({
    activeSection,
    isTauri = false,
    onNavigate,
    onClose,
    className = '',
}: AccountSidebarProps) {
    const pathname = usePathname()
    const locale = useLocaleStore(selectLocale)
    const t = ACCOUNT_STRINGS[locale]
    const navGroups = getAccountNavGroups(t)
    const about = getAccountAbout(t)
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
        initOpenGroups,
    )

    useEffect(() => {
        const slug = pathname
            .replace(/^\/account\/?/, '')
            .split('/')
            .filter(Boolean)
        const section = slugToSection(slug.length ? slug : undefined)
        if (!section) return
        const groups = getAccountNavGroups(t)
        setOpenGroups((prev) => {
            const next = { ...prev }
            for (const group of groups) {
                if (group.children.some((c) => c.id === section)) {
                    next[group.id] = true
                }
            }
            return next
        })
    }, [pathname, locale])

    function toggleGroup(id: string) {
        setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    const asideBg = isTauri
        ? 'bg-zinc-50 dark:bg-zinc-900/60'
        : 'bg-white md:bg-transparent dark:bg-zinc-950 md:dark:bg-transparent'

    return (
        <aside
            className={`flex h-full min-h-0 w-full shrink-0 flex-col ${asideBg} ${className}`}
        >
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <div
                    className={`shrink-0 ${
                        isTauri
                            ? 'border-b border-zinc-200/80 px-4 pt-3 pb-4 dark:border-zinc-800 sm:pt-4 lg:px-5'
                            : 'px-5 pb-4 pt-3 sm:pt-4'
                    }`}
                >
                    <div className="flex flex-row items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 pr-2">
                            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
                                {t.centerTitle}
                            </h2>
                            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
                                <Link
                                    href="/"
                                    onClick={onNavigate}
                                    className="inline-flex items-center gap-1 font-medium text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.25"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden
                                    >
                                        <path d="M15 6 9 12l6 6" />
                                    </svg>
                                    {t.backHome}
                                </Link>
                            </p>
                        </div>
                        {onClose ? (
                            <button
                                type="button"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:hidden dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                aria-label={t.closeMenu}
                                onClick={onClose}
                            >
                                <IconClose className="h-5 w-5" />
                            </button>
                        ) : null}
                    </div>
                </div>

                <nav
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
                    aria-label={t.navAria}
                >
                    <div className="flex flex-col gap-4">
                        {navGroups.map((group) => {
                            const isOpen = openGroups[group.id] ?? false
                            const groupButtonClass =
                                'flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'

                            return (
                                <div key={group.id}>
                                    <button
                                        type="button"
                                        className={groupButtonClass}
                                        aria-expanded={isOpen}
                                        onClick={() => toggleGroup(group.id)}
                                    >
                                        <span>{group.label}</span>
                                        <IconChevron open={isOpen} />
                                    </button>
                                    <div
                                        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                                            isOpen
                                                ? 'grid-rows-[1fr]'
                                                : 'pointer-events-none grid-rows-[0fr]'
                                        }`}
                                    >
                                        <ul className="space-y-0.5 overflow-hidden pt-1">
                                            {group.children.map((item) => (
                                                <li key={item.id}>
                                                    <Link
                                                        href={item.href}
                                                        onClick={onNavigate}
                                                        className={navLinkClass(
                                                            activeSection ===
                                                                item.id,
                                                        )}
                                                        aria-current={
                                                            activeSection ===
                                                            item.id
                                                                ? 'page'
                                                                : undefined
                                                        }
                                                    >
                                                        {item.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </nav>

                <div
                    className={`shrink-0 px-3 ${
                        isTauri
                            ? 'border-t border-zinc-200/80 py-3 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/80'
                            : 'pb-5 pt-2'
                    }`}
                >
                    <Link
                        href={about.href}
                        onClick={onNavigate}
                        className={navLinkClass(activeSection === about.id)}
                        aria-current={
                            activeSection === about.id ? 'page' : undefined
                        }
                    >
                        {about.label}
                    </Link>
                </div>
            </div>
        </aside>
    )
}
