'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AccountSidebar } from '@/components/account/account-sidebar'
import {
    pageContainerClass,
    pageOuterClass,
} from '@/components/layout/page-shell'
import { useTauriDesktop } from '@/hooks/use-tauri-desktop'
import {
    DEFAULT_ACCOUNT_SECTION,
    pathnameToSection,
    sectionTitle,
    sectionToPath,
} from '@/lib/account-nav'
import { ACCOUNT_STRINGS } from '@/locales/account'
import { setAuthSession } from '@/lib/auth-token'
import { selectLocale, useLocaleStore } from '@/stores/locale-store'
const webShellClass =
    'flex min-h-[min(720px,calc(100dvh-5rem))] flex-1 flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 md:flex-row'

const tauriShellClass =
    'flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:flex-row dark:bg-zinc-950'

type AccountLayoutClientProps = {
    children: React.ReactNode
}

function IconMenu({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
        >
            <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
    )
}

export function AccountLayoutClient({ children }: AccountLayoutClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const isTauri = useTauriDesktop()
    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const locale = useLocaleStore(selectLocale)
    const t = ACCOUNT_STRINGS[locale]

    const activeSection = pathnameToSection(pathname)
    const pageTitle = activeSection ? sectionTitle(activeSection, t) : ''

    // Normalize /account → /account/profile/
    useEffect(() => {
        if (pathname === '/account' || pathname === '/account/') {
            router.replace(sectionToPath(DEFAULT_ACCOUNT_SECTION))
            return
        }
        if (activeSection === null && pathname.startsWith('/account')) {
            router.replace(sectionToPath(DEFAULT_ACCOUNT_SECTION))
        }
    }, [pathname, activeSection, router])

    // OAuth callback: /account/profile/?token=...
    useEffect(() => {
        if (typeof window === 'undefined') return
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')?.trim()
        if (!token) return

        let cancelled = false
        ;(async () => {
            try {
                const { fetchCurrentUser } = await import('@/lib/auth-api')
                const user = await fetchCurrentUser(token)
                if (cancelled) return
                setAuthSession({ token, user })
                params.delete('token')
                const next = `${window.location.pathname}${
                    params.toString() ? `?${params}` : ''
                }`
                router.replace(next)
            } catch (err) {
                console.error('OAuth session restore failed', err)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [router])

    useEffect(() => {
        setMobileNavOpen(false)
    }, [pathname])

    useEffect(() => {
        if (!mobileNavOpen || isTauri) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [mobileNavOpen, isTauri])

    useEffect(() => {
        if (!isTauri) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [isTauri])

    const outerClass = isTauri
        ? 'flex h-dvh flex-col overflow-hidden bg-zinc-100 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100'
        : pageOuterClass

    const containerClass = isTauri
        ? 'flex min-h-0 flex-1 flex-col'
        : pageContainerClass

    const shellClass = isTauri ? tauriShellClass : webShellClass

    const sidebarWrapperClass = isTauri
        ? 'flex h-full w-56 shrink-0 flex-col lg:w-56'
        : [
              'fixed inset-y-0 left-0 z-50 flex w-[min(100%,18rem)] flex-col transition-transform duration-300 ease-out md:static md:z-auto md:h-auto md:w-56 md:shrink-0 md:translate-x-0 lg:w-60',
              mobileNavOpen
                  ? 'translate-x-0'
                  : '-translate-x-full md:translate-x-0',
          ].join(' ')

    return (
        <div className={outerClass}>
            <div className={containerClass}>
                {!isTauri && mobileNavOpen ? (
                    <button
                        type="button"
                        className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-[2px] md:hidden"
                        aria-label={t.closeMenu}
                        onClick={() => setMobileNavOpen(false)}
                    />
                ) : null}

                <div className={shellClass}>
                    <div className={sidebarWrapperClass}>
                        {activeSection ? (
                            <AccountSidebar
                                activeSection={activeSection}
                                isTauri={isTauri}
                                onNavigate={() => setMobileNavOpen(false)}
                                onClose={
                                    isTauri
                                        ? undefined
                                        : () => setMobileNavOpen(false)
                                }
                                className={
                                    isTauri
                                        ? 'h-full border-r border-zinc-200 dark:border-zinc-800'
                                        : 'h-full shadow-xl md:bg-zinc-50/70 md:shadow-none md:dark:bg-zinc-900/25'
                                }
                            />
                        ) : null}
                    </div>

                    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                        <header className="flex shrink-0 items-center gap-3 px-4 py-3 md:hidden">
                            <button
                                type="button"
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                aria-label={
                                    mobileNavOpen ? t.closeMenu : t.openMenu
                                }
                                aria-expanded={mobileNavOpen}
                                onClick={() =>
                                    setMobileNavOpen((open) => !open)
                                }
                            >
                                <IconMenu className="h-5 w-5" />
                            </button>
                            <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                                {pageTitle}
                            </h2>
                        </header>
                        <main
                            className={
                                isTauri
                                    ? 'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 py-6 lg:px-8 lg:py-8'
                                    : 'flex min-h-0 flex-1 flex-col overflow-y-auto p-5 sm:p-6 lg:p-8'
                            }
                        >
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    )
}
