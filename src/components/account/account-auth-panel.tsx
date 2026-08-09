'use client'

import { useState } from 'react'
import { EmailLoginForm } from '@/components/auth/email-login-form'
import { EmailRegisterForm } from '@/components/auth/email-register-form'
import { getOAuthStartUrl } from '@/lib/auth-api'
import { ACCOUNT_STRINGS, type AccountStrings } from '@/locales/account'
import { selectLocale, useLocaleStore } from '@/stores/locale-store'

type AuthMode = 'login' | 'register'

function tabClass(active: boolean) {
    if (active) {
        return 'flex-1 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
    }
    return 'flex-1 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
}

const oauthButtonClass =
    'flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800'

function IconGoogle({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden
        >
            <path
                fill="#EA4335"
                d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
            />
            <path
                fill="#34A853"
                d="M6.6 14.3 5.8 14.9l-2.7 2.1C4.7 20.1 8.1 22.2 12 22.2c2.4 0 4.4-.8 5.9-2.1l-3.1-2.4c-.8.6-1.9.9-2.8.9-2.2 0-4-1.5-4.7-3.4z"
            />
            <path
                fill="#4A90E2"
                d="M3.1 7.1C2.4 8.5 2 10 2 11.8s.4 3.3 1.1 4.7l3.5-2.7c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2z"
            />
            <path
                fill="#FBBC05"
                d="M12 5.5c1.3 0 2.5.5 3.4 1.3l2.6-2.6C16.4 2.6 14.4 1.8 12 1.8 8.1 1.8 4.7 3.9 3.1 7.1l3.5 2.7C7.9 7 9.8 5.5 12 5.5z"
            />
        </svg>
    )
}

function IconGitHub({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
        >
            <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.8c.85 0 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
        </svg>
    )
}

/** UI-only third-party buttons; wiring comes later. */
function ThirdPartyAuthButtons({ t }: { t: AccountStrings }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3" aria-hidden>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                <span className="shrink-0 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    {t.authOauthDivider}
                </span>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    className={oauthButtonClass}
                    onClick={() => {
                        window.location.href = getOAuthStartUrl('google')
                    }}
                >
                    <IconGoogle />
                    {t.authOauthGoogle}
                </button>
                <button
                    type="button"
                    className={oauthButtonClass}
                    onClick={() => {
                        window.location.href = getOAuthStartUrl('github')
                    }}
                >
                    <IconGitHub />
                    {t.authOauthGitHub}
                </button>
            </div>
        </div>
    )
}

/** Login / register embedded in the account center when signed out. */
export function AccountAuthPanel() {
    const locale = useLocaleStore(selectLocale)
    const t = ACCOUNT_STRINGS[locale]
    const [mode, setMode] = useState<AuthMode>('login')

    const title =
        mode === 'login' ? t.authLoginTitle : t.authRegisterTitle
    const description =
        mode === 'login' ? t.authLoginSubtitle : t.authRegisterSubtitle

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
            <div className="mx-auto w-full max-w-md min-w-0 space-y-5">
                <div className="text-center">
                    <h2 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl dark:text-zinc-50">
                        {title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        {description}
                    </p>
                </div>

                <div
                    className="flex gap-1 rounded-2xl bg-zinc-100/90 p-1 dark:bg-zinc-900/80"
                    role="tablist"
                    aria-label={t.authTabsAria}
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'login'}
                        className={tabClass(mode === 'login')}
                        onClick={() => setMode('login')}
                    >
                        {t.authLoginTab}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'register'}
                        className={tabClass(mode === 'register')}
                        onClick={() => setMode('register')}
                    >
                        {t.authRegisterTab}
                    </button>
                </div>

                {mode === 'login' ? (
                    <EmailLoginForm
                        onSwitchToRegister={() => setMode('register')}
                    />
                ) : (
                    <EmailRegisterForm
                        onSwitchToLogin={() => setMode('login')}
                    />
                )}

                <ThirdPartyAuthButtons t={t} />
            </div>
        </div>
    )
}
