'use client'

import { useId, useRef, useState, type ChangeEvent } from 'react'
import {
    formInputClass,
    formLabelClass,
} from '@/components/app-detail/form-field-styles'
import { FormSingleSelect } from '@/components/app-detail/form-single-select'

export const STARTUP_AUTH_MODE_KEYS = [
    'none',
    'always',
    'once',
    'online',
] as const

export type StartupAuthModeKey = (typeof STARTUP_AUTH_MODE_KEYS)[number]

export const STARTUP_AUTH_THEME_KEYS = ['dark', 'light', 'system'] as const

export type StartupAuthThemeKey = (typeof STARTUP_AUTH_THEME_KEYS)[number]

export const STARTUP_PASSWORD_STYLE_KEYS = ['flat', 'card'] as const

export type StartupPasswordStyleKey =
    (typeof STARTUP_PASSWORD_STYLE_KEYS)[number]

export type StartupConfigLabels = {
    splashTitle: string
    splashEnabled: string
    splashImage: string
    splashUpload: string
    splashClear: string
    splashHint: string
    splashDurationLabel: string
    splashDurationPlaceholder: string
    splashDurationUnit: string
    splashClickUrlLabel: string
    splashClickUrlPlaceholder: string
    authModeLabel: string
    authModeNone: string
    authModeAlways: string
    authModeOnce: string
    authModeOnline: string
    authThemeLabel: string
    authThemeDark: string
    authThemeLight: string
    authThemeSystem: string
    passwordStyleLabel: string
    passwordStyleFlat: string
    passwordStyleCard: string
    authTitleLabel: string
    authTitlePlaceholder: string
    passwordPlaceholderLabel: string
    passwordPlaceholderHint: string
    defaultPasswordLabel: string
    defaultPasswordPlaceholder: string
    authButtonLabel: string
    authButtonPlaceholder: string
    authHintLabel: string
    authHintPlaceholder: string
    authErrorLabel: string
    authErrorPlaceholder: string
}

type StartupConfigSectionProps = {
    labels: StartupConfigLabels
}

const cardClass =
    'rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-700 dark:bg-zinc-900'

const cardTitleClass =
    'text-base font-semibold tracking-tight text-zinc-900 dark:text-white'

const checkboxClass =
    'h-4 w-4 shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-blue-500/30 dark:border-zinc-600'

function readImageAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

function SplashPlaceholderIcon({ className }: { className?: string }) {
    return (
        <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden
        >
            <path
                d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="m7.5 15.5 3-3.5 2.2 2.5 3.3-4 3.5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="9" cy="9" r="1.25" fill="currentColor" />
        </svg>
    )
}

/**
 * Startup config UI matching Android「启动配置」: splash + auth mode/theme/style
 * + auth copy fields. Local state only (UI scaffold until pack wiring).
 */
export function StartupConfigSection({ labels }: StartupConfigSectionProps) {
    const splashInputId = useId()
    const splashInputRef = useRef<HTMLInputElement>(null)

    const [splashEnabled, setSplashEnabled] = useState(true)
    const [splashImage, setSplashImage] = useState('')
    const [splashDurationMs, setSplashDurationMs] = useState(800)
    const [splashClickUrl, setSplashClickUrl] = useState('')
    const [authMode, setAuthMode] = useState<StartupAuthModeKey>('none')
    const [authTheme, setAuthTheme] = useState<StartupAuthThemeKey>('system')
    const [passwordStyle, setPasswordStyle] =
        useState<StartupPasswordStyleKey>('flat')
    const [authTitle, setAuthTitle] = useState('')
    const [passwordPlaceholder, setPasswordPlaceholder] = useState('')
    const [defaultPassword, setDefaultPassword] = useState('')
    const [authButtonText, setAuthButtonText] = useState('')
    const [authHint, setAuthHint] = useState('')
    const [authError, setAuthError] = useState('')

    const authModeOptions = [
        { value: 'none', label: labels.authModeNone },
        { value: 'always', label: labels.authModeAlways },
        { value: 'once', label: labels.authModeOnce },
        { value: 'online', label: labels.authModeOnline },
    ]
    const authThemeOptions = [
        { value: 'dark', label: labels.authThemeDark },
        { value: 'light', label: labels.authThemeLight },
        { value: 'system', label: labels.authThemeSystem },
    ]
    const passwordStyleOptions = [
        { value: 'flat', label: labels.passwordStyleFlat },
        { value: 'card', label: labels.passwordStyleCard },
    ]

    async function handleSplashChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file || !file.type.startsWith('image/')) return
        const dataUrl = await readImageAsDataUrl(file)
        setSplashImage(dataUrl)
    }

    function clearSplash() {
        setSplashImage('')
    }

    return (
        <div className="flex w-full flex-col gap-5">
            <section
                className={cardClass}
                aria-labelledby="startup-splash-title"
            >
                <h3 id="startup-splash-title" className={cardTitleClass}>
                    {labels.splashTitle}
                </h3>
                <div className="mt-4 flex flex-col gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <label
                            htmlFor="startup-splash-enabled"
                            className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                        >
                            <input
                                id="startup-splash-enabled"
                                type="checkbox"
                                className={checkboxClass}
                                checked={splashEnabled}
                                onChange={(e) => setSplashEnabled(e.target.checked)}
                            />
                            <span className="min-w-0 text-sm text-zinc-800 dark:text-zinc-200">
                                {labels.splashEnabled}
                            </span>
                        </label>

                        <div className="flex min-w-0 flex-1 items-center gap-3 sm:justify-end">
                            <span className={`${formLabelClass} shrink-0`}>
                                {labels.splashImage}
                            </span>
                            <input
                                ref={splashInputRef}
                                id={splashInputId}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="sr-only"
                                onChange={handleSplashChange}
                            />
                            <button
                                type="button"
                                className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 ${
                                    splashImage
                                        ? 'bg-zinc-100 dark:bg-zinc-950'
                                        : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                                }`}
                                aria-label={labels.splashUpload}
                                title={labels.splashHint}
                                onClick={() => splashInputRef.current?.click()}
                            >
                                {splashImage ? (
                                    <img
                                        src={splashImage}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <SplashPlaceholderIcon />
                                )}
                            </button>
                            {splashImage ? (
                                <button
                                    type="button"
                                    className="shrink-0 text-sm font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    onClick={clearSplash}
                                >
                                    {labels.splashClear}
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="startup-splash-duration"
                                className={formLabelClass}
                            >
                                {labels.splashDurationLabel}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="startup-splash-duration"
                                    type="number"
                                    min={0}
                                    step={1}
                                    inputMode="numeric"
                                    value={splashDurationMs}
                                    onChange={(e) =>
                                        setSplashDurationMs(
                                            Math.max(
                                                0,
                                                Number(e.target.value) || 0,
                                            ),
                                        )
                                    }
                                    className={formInputClass}
                                    placeholder={
                                        labels.splashDurationPlaceholder
                                    }
                                    autoComplete="off"
                                />
                                <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                                    {labels.splashDurationUnit}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="startup-splash-click-url"
                                className={formLabelClass}
                            >
                                {labels.splashClickUrlLabel}
                            </label>
                            <input
                                id="startup-splash-click-url"
                                type="url"
                                inputMode="url"
                                value={splashClickUrl}
                                onChange={(e) =>
                                    setSplashClickUrl(e.target.value)
                                }
                                className={formInputClass}
                                placeholder={labels.splashClickUrlPlaceholder}
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className={cardClass}>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div className="flex flex-col gap-2">
                        <span className={formLabelClass}>
                            {labels.authModeLabel}
                        </span>
                        <FormSingleSelect
                            aria-label={labels.authModeLabel}
                            options={authModeOptions}
                            value={authMode}
                            onChange={(value) =>
                                setAuthMode(value as StartupAuthModeKey)
                            }
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className={formLabelClass}>
                            {labels.authThemeLabel}
                        </span>
                        <FormSingleSelect
                            aria-label={labels.authThemeLabel}
                            options={authThemeOptions}
                            value={authTheme}
                            onChange={(value) =>
                                setAuthTheme(value as StartupAuthThemeKey)
                            }
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className={formLabelClass}>
                            {labels.passwordStyleLabel}
                        </span>
                        <FormSingleSelect
                            aria-label={labels.passwordStyleLabel}
                            options={passwordStyleOptions}
                            value={passwordStyle}
                            onChange={(value) =>
                                setPasswordStyle(
                                    value as StartupPasswordStyleKey,
                                )
                            }
                        />
                    </div>
                </div>
            </section>

            <section className={cardClass}>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="startup-auth-title"
                            className={formLabelClass}
                        >
                            {labels.authTitleLabel}
                        </label>
                        <input
                            id="startup-auth-title"
                            type="text"
                            value={authTitle}
                            onChange={(e) => setAuthTitle(e.target.value)}
                            className={formInputClass}
                            placeholder={labels.authTitlePlaceholder}
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="startup-password-placeholder"
                            className={formLabelClass}
                        >
                            {labels.passwordPlaceholderLabel}
                        </label>
                        <input
                            id="startup-password-placeholder"
                            type="text"
                            value={passwordPlaceholder}
                            onChange={(e) =>
                                setPasswordPlaceholder(e.target.value)
                            }
                            className={formInputClass}
                            placeholder={labels.passwordPlaceholderHint}
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="startup-default-password"
                            className={formLabelClass}
                        >
                            {labels.defaultPasswordLabel}
                        </label>
                        <input
                            id="startup-default-password"
                            type="password"
                            value={defaultPassword}
                            onChange={(e) => setDefaultPassword(e.target.value)}
                            className={formInputClass}
                            placeholder={labels.defaultPasswordPlaceholder}
                            autoComplete="new-password"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="startup-auth-button"
                            className={formLabelClass}
                        >
                            {labels.authButtonLabel}
                        </label>
                        <input
                            id="startup-auth-button"
                            type="text"
                            value={authButtonText}
                            onChange={(e) => setAuthButtonText(e.target.value)}
                            className={formInputClass}
                            placeholder={labels.authButtonPlaceholder}
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="startup-auth-hint"
                            className={formLabelClass}
                        >
                            {labels.authHintLabel}
                        </label>
                        <input
                            id="startup-auth-hint"
                            type="text"
                            value={authHint}
                            onChange={(e) => setAuthHint(e.target.value)}
                            className={formInputClass}
                            placeholder={labels.authHintPlaceholder}
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="startup-auth-error"
                            className={formLabelClass}
                        >
                            {labels.authErrorLabel}
                        </label>
                        <input
                            id="startup-auth-error"
                            type="text"
                            value={authError}
                            onChange={(e) => setAuthError(e.target.value)}
                            className={formInputClass}
                            placeholder={labels.authErrorPlaceholder}
                            autoComplete="off"
                        />
                    </div>
                </div>
            </section>
        </div>
    )
}
