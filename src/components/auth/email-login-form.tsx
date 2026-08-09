'use client'

import { useState } from 'react'
import { AuthApiError, login } from '@/lib/auth-api'
import { setAuthSession } from '@/lib/auth-token'
import { ACCOUNT_STRINGS, type AccountStrings } from '@/locales/account'
import { selectLocale, useLocaleStore } from '@/stores/locale-store'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateLogin(email: string, password: string, t: AccountStrings) {
    const next: Partial<Record<'email' | 'password', string>> = {}
    if (!email.trim()) next.email = t.errEmailRequired
    else if (!emailPattern.test(email.trim())) next.email = t.errEmailInvalid
    if (!password) next.password = t.errPasswordRequired
    return next
}

type EmailLoginFormProps = {
    onSuccess?: () => void
    onSwitchToRegister?: () => void
}

export function EmailLoginForm({
    onSuccess,
    onSwitchToRegister,
}: EmailLoginFormProps) {
    const locale = useLocaleStore(selectLocale)
    const t = ACCOUNT_STRINGS[locale]
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState<
        Partial<Record<'email' | 'password', string>>
    >({})
    const [submitting, setSubmitting] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [statusMessage, setStatusMessage] = useState('')

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setStatus('idle')
        setStatusMessage('')
        const v = validateLogin(email, password, t)
        setErrors(v)
        if (Object.keys(v).length > 0) return

        setSubmitting(true)
        try {
            const res = await login({
                email: email.trim(),
                password,
            })
            setAuthSession({ token: res.token, user: res.user })
            onSuccess?.()
        } catch (err) {
            setStatus('error')
            setStatusMessage(
                err instanceof AuthApiError ? err.message : t.errLoginFailed,
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="login-email"
                    className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                    {t.emailLabel}
                </label>
                <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none ring-zinc-400 transition-[box-shadow,border-color] placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/30"
                    placeholder={t.emailPlaceholder}
                />
                {errors.email ? (
                    <p
                        className="text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {errors.email}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                    <label
                        htmlFor="login-password"
                        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                    >
                        {t.passwordLabel}
                    </label>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">
                        {t.forgotPassword}
                    </span>
                </div>
                <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none ring-zinc-400 transition-[box-shadow,border-color] placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/30"
                    placeholder={t.passwordPlaceholder}
                />
                {errors.password ? (
                    <p
                        className="text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {errors.password}
                    </p>
                ) : null}
            </div>

            {status !== 'idle' ? (
                <p
                    className={
                        status === 'success'
                            ? 'text-sm text-emerald-600 dark:text-emerald-400'
                            : 'text-sm text-red-600 dark:text-red-400'
                    }
                    role="status"
                >
                    {statusMessage}
                </p>
            ) : null}

            <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
                {submitting ? t.loginSubmitting : t.loginSubmit}
            </button>

            {onSwitchToRegister ? (
                <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                    {t.noAccountPrompt}{' '}
                    <button
                        type="button"
                        className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
                        onClick={onSwitchToRegister}
                    >
                        {t.switchToRegister}
                    </button>
                </p>
            ) : null}
        </form>
    )
}
