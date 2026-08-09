'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
    HeaderActions,
    headerIconButtonClass,
} from '@/components/home/header-actions'
import type { AuthUser } from '@/lib/auth-types'
import type { HomeStrings } from '@/locales/home'
import type { HomeLocale } from '@/locales/home'
import type { ColorScheme } from '@/stores/theme-store'

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

function MobileMenuToggle({
    open,
    onToggle,
    label,
}: {
    open: boolean
    onToggle: () => void
    label: string
}) {
    const buttonProps = {
        type: 'button' as const,
        className: headerIconButtonClass(open),
        'aria-haspopup': true as const,
        'aria-label': label,
        onClick: onToggle,
    }

    return open ? (
        <button {...buttonProps} aria-expanded="true">
            <IconMenu className="h-5 w-5" />
        </button>
    ) : (
        <button {...buttonProps} aria-expanded="false">
            <IconMenu className="h-5 w-5" />
        </button>
    )
}

function IconGithub({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
        >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
    )
}

type HomeHeaderProps = {
    t: HomeStrings
    locale: HomeLocale
    setLocale: (locale: HomeLocale) => void
    colorScheme: ColorScheme
    toggleColorScheme: () => void
    authUser: AuthUser | null
    onSettingsClick: () => void
    title?: string
    subtitle?: ReactNode
}

export function HomeHeader({
    t,
    locale,
    setLocale,
    colorScheme,
    toggleColorScheme,
    authUser,
    onSettingsClick,
    title,
    subtitle,
}: HomeHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const mobileMenuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!mobileMenuOpen) return
        const onPointer = (e: MouseEvent | TouchEvent) => {
            const el = mobileMenuRef.current
            if (el && !el.contains(e.target as Node)) setMobileMenuOpen(false)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileMenuOpen(false)
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

    function handleSettingsClick() {
        setMobileMenuOpen(false)
        onSettingsClick()
    }

    const actionsProps = {
        t,
        locale,
        setLocale,
        colorScheme,
        toggleColorScheme,
        authUser,
        onSettingsClick: handleSettingsClick,
    }

    return (
        <header className="mb-4 shrink-0 px-1">
            <div className="flex flex-row items-start justify-between gap-4 md:items-center">
                <div className="min-w-0 flex-1 pr-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
                        {title ?? t.pageTitle}
                    </h2>
                    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
                        {subtitle ?? (
                            <>
                                <span>{t.pageSubtitle}</span>
                                <a
                                    href="https://github.com/PakePlus/TauriHub"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex shrink-0 text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                                    aria-label={t.githubAria}
                                >
                                    <IconGithub />
                                </a>
                            </>
                        )}
                    </p>
                </div>

                {/* 移动端：右上角菜单 */}
                <div
                    className="relative shrink-0 md:hidden"
                    ref={mobileMenuRef}
                >
                    <button
                        type="button"
                        className={headerIconButtonClass(mobileMenuOpen)}
                        aria-expanded="false"
                        aria-haspopup="true"
                        aria-label={t.menuAria}
                        onClick={() => setMobileMenuOpen((o) => !o)}
                    >
                        <IconMenu className="h-5 w-5" />
                    </button>
                    {mobileMenuOpen ? (
                        <div
                            className="absolute right-0 z-30 mt-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                            role="menu"
                        >
                            <HeaderActions
                                {...actionsProps}
                                className="flex flex-col gap-2"
                            />
                        </div>
                    ) : null}
                </div>

                {/* 平板及以上：同一行展示操作按钮 */}
                <HeaderActions
                    {...actionsProps}
                    className="hidden shrink-0 items-center gap-2 md:flex"
                />
            </div>
        </header>
    )
}
