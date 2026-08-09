'use client'

import { useState } from 'react'
import { AuthApiError, checkRegistered, register } from '@/lib/auth-api'
import { setAuthSession } from '@/lib/auth-token'
import {
    ACCOUNT_STRINGS,
    formatAccountTemplate,
    type AccountStrings,
} from '@/locales/account'
import { selectLocale, useLocaleStore } from '@/stores/locale-store'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 6

function validateRegister(email: string, password: string, t: AccountStrings) {
    const next: Partial<Record<'email' | 'password', string>> = {}
    if (!email.trim()) next.email = t.errEmailRequired
    else if (!emailPattern.test(email.trim())) next.email = t.errEmailInvalid
    if (!password) next.password = t.errPasswordSetRequired
    else if (password.length < MIN_PASSWORD)
        next.password = formatAccountTemplate(t.errPasswordMin, {
            min: MIN_PASSWORD,
        })
    return next
}

type EmailRegisterFormProps = {
    onSuccess?: () => void
    onSwitchToLogin?: () => void
}

export function EmailRegisterForm({
    onSuccess,
    onSwitchToLogin,
}: EmailRegisterFormProps) {
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
        const v = validateRegister(email, password, t)
        setErrors(v)
        if (Object.keys(v).length > 0) return

        setSubmitting(true)
        try {
            const trimmedEmail = email.trim()
            const { registered } = await checkRegistered({
                email: trimmedEmail,
            })
            if (registered) {
                setStatus('error')
                setStatusMessage(t.errEmailRegistered)
                return
            }

            const res = await register({
                email: trimmedEmail,
                password,
            })
            setAuthSession({ token: res.token, user: res.user })
            onSuccess?.()
        } catch (err) {
            setStatus('error')
            setStatusMessage(
                err instanceof AuthApiError
                    ? err.message
                    : t.errRegisterFailed,
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="register-email"
                    className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                    {t.emailLabel}
                </label>
                <input
                    id="register-email"
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
                <label
                    htmlFor="register-password"
                    className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                    {t.passwordLabel}
                </label>
                <input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none ring-zinc-400 transition-[box-shadow,border-color] placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/30"
                    placeholder={formatAccountTemplate(
                        t.passwordMinPlaceholder,
                        { min: MIN_PASSWORD },
                    )}
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
                {submitting ? t.registerSubmitting : t.registerSubmit}
            </button>

            {onSwitchToLogin ? (
                <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                    {t.hasAccountPrompt}{' '}
                    <button
                        type="button"
                        className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
                        onClick={onSwitchToLogin}
                    >
                        {t.switchToLogin}
                    </button>
                </p>
            ) : null}
        </form>
    )
}
