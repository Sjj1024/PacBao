'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
    HOME_LOCALE_LABELS,
    type HomeLocale,
    type HomeStrings,
} from '@/locales/home'
import { getAuthDisplayName, type AuthUser } from '@/lib/auth-types'
import type { ColorScheme } from '@/stores/theme-store'

function IconSun({ className }: { className?: string }) {
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
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
    )
}

function IconMoon({ className }: { className?: string }) {
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
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
    )
}

function IconLanguages({ className }: { className?: string }) {
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
            <path d="m5 8 6 6" />
            <path d="m4 14 6-6 2-3" />
            <path d="M2 5h12" />
            <path d="M7 2h1" />
            <path d="m22 22-5-10-5 10" />
            <path d="M14 18h6" />
        </svg>
    )
}

function IconUser({ className }: { className?: string }) {
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
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}

function IconGear({ className }: { className?: string }) {
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
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

export function headerIconButtonClass(active?: boolean) {
    return [
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
        active
            ? 'border-zinc-400 bg-zinc-200 text-zinc-800 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100'
            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200',
    ].join(' ')
}

function headerAvatarButtonClass() {
    return [
        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border transition-colors',
        'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200',
    ].join(' ')
}

/** Display order matches the language menu design reference. */
const LOCALE_MENU_ORDER: readonly HomeLocale[] = [
    'en',
    'zh-CN',
    'zh-TW',
    'ja',
    'ko',
]

function UserAccountButton({
    user,
    label,
    onClick,
}: {
    user: AuthUser
    label: string
    onClick: () => void
}) {
    const [imgFailed, setImgFailed] = useState(false)
    const avatarUrl = user.avatar?.trim()
    const showImage = Boolean(avatarUrl) && !imgFailed

    return (
        <button
            type="button"
            className={headerAvatarButtonClass()}
            aria-label={label}
            onClick={onClick}
        >
            {showImage ? (
                <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setImgFailed(true)}
                />
            ) : (
                <IconUser className="h-5 w-5" />
            )}
        </button>
    )
}

function LocaleMenu({
    locale,
    setLocale,
    label,
}: {
    locale: HomeLocale
    setLocale: (locale: HomeLocale) => void
    label: string
}) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const menuId = useId()

    useEffect(() => {
        if (!open) return

        function onPointerDown(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    return (
        <div className="relative inline-flex" ref={rootRef}>
            <button
                type="button"
                className={headerIconButtonClass(open)}
                aria-label={label}
                title={label}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-controls={open ? menuId : undefined}
                onClick={(e) => {
                    e.stopPropagation()
                    setOpen((value) => !value)
                }}
            >
                <IconLanguages className="h-5 w-5" />
            </button>
            {open ? (
                <div
                    id={menuId}
                    role="menu"
                    aria-label={label}
                    className="absolute right-0 z-40 mt-2 w-[7.5rem] overflow-hidden rounded-xl bg-white py-1 shadow-[0_8px_28px_rgba(0,0,0,0.12)] dark:bg-zinc-900 dark:shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
                >
                    {LOCALE_MENU_ORDER.map((code) => {
                        const selected = code === locale
                        return (
                            <button
                                key={code}
                                type="button"
                                role="menuitemradio"
                                aria-checked={selected}
                                className={[
                                    'block w-full px-3 py-2.5 text-center text-[15px] leading-snug transition-colors',
                                    selected
                                        ? 'bg-sky-50 text-sky-500 dark:bg-sky-950/50 dark:text-sky-400'
                                        : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800',
                                ].join(' ')}
                                onClick={() => {
                                    setLocale(code)
                                    setOpen(false)
                                }}
                            >
                                {HOME_LOCALE_LABELS[code]}
                            </button>
                        )
                    })}
                </div>
            ) : null}
        </div>
    )
}

type HeaderActionsProps = {
    t: HomeStrings
    locale: HomeLocale
    setLocale: (locale: HomeLocale) => void
    colorScheme: ColorScheme
    toggleColorScheme: () => void
    authUser: AuthUser | null
    onSettingsClick: () => void
    className?: string
}

export function HeaderActions({
    t,
    locale,
    setLocale,
    colorScheme,
    toggleColorScheme,
    authUser,
    onSettingsClick,
    className = 'flex items-center gap-2',
}: HeaderActionsProps) {
    return (
        <div className={className}>
            <button
                type="button"
                className={headerIconButtonClass(false)}
                aria-label={
                    colorScheme === 'dark'
                        ? t.themeSwitchToLight
                        : t.themeSwitchToDark
                }
                aria-pressed={colorScheme === 'dark' ? 'true' : 'false'}
                onClick={(e) => {
                    e.stopPropagation()
                    toggleColorScheme()
                }}
            >
                {colorScheme === 'dark' ? (
                    <IconSun className="h-5 w-5" />
                ) : (
                    <IconMoon className="h-5 w-5" />
                )}
            </button>
            <LocaleMenu
                locale={locale}
                setLocale={setLocale}
                label={t.languageLabel}
            />
            {authUser ? (
                <UserAccountButton
                    user={authUser}
                    label={`${t.userMenuAria}：${getAuthDisplayName(authUser)}`}
                    onClick={onSettingsClick}
                />
            ) : (
                <button
                    type="button"
                    className={headerIconButtonClass(false)}
                    aria-label={t.settingsAria}
                    onClick={onSettingsClick}
                >
                    <IconGear className="h-5 w-5" />
                </button>
            )}
        </div>
    )
}
