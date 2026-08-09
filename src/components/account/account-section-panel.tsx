'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { AccountAuthPanel } from '@/components/account/account-auth-panel'
import { useTauriDesktop } from '@/hooks/use-tauri-desktop'
import { getApiBaseUrl } from '@/lib/auth-api'
import { getAuthDisplayName, type AuthUser } from '@/lib/auth-types'
import type { AccountSectionId } from '@/lib/account-nav'
import { sectionTitle } from '@/lib/account-nav'
import { clearAuthSession } from '@/lib/auth-token'
import {
    ENVIRONMENT_TOOLCHAIN,
    getLocalStorageUsageBytes,
    type EnvironmentToolchainKey,
} from '@/lib/environment-toolchain'
import { formatBytes } from '@/lib/format-bytes'
import {
    ACCOUNT_STRINGS,
    formatAccountTemplate,
    type AccountStrings,
} from '@/locales/account'
import { selectLocale, useLocaleStore } from '@/stores/locale-store'

const TOOLCHAIN_LABELS: Record<
    EnvironmentToolchainKey,
    keyof AccountStrings
> = {
    rust: 'labelRust',
    node: 'labelNode',
    npm: 'labelNpm',
    java: 'labelJava',
    python: 'labelPython',
    cpp: 'labelCpp',
    web: 'labelWeb',
}

const btnSecondary =
    'inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'

const btnSecondaryWeb =
    'inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'

const cardClass =
    'rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6'

const webCardClass =
    'rounded-2xl bg-zinc-50/70 p-5 dark:bg-zinc-900/30 sm:p-6'

function surfaceClass(isTauri: boolean) {
    return isTauri ? cardClass : webCardClass
}

type AccountSectionPanelProps = {
    section: AccountSectionId
    authUser: AuthUser | null
    authReady?: boolean
}

function PanelShell({
    title,
    description,
    children,
    hideTitle = false,
}: {
    title: string
    description?: string
    children?: ReactNode
    hideTitle?: boolean
}) {
    return (
        <div className="min-w-0">
            {!hideTitle ? (
                <>
                    <h2 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl dark:text-zinc-50">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                            {description}
                        </p>
                    ) : null}
                </>
            ) : null}
            {children ? (
                <div className={hideTitle ? '' : 'mt-6'}>{children}</div>
            ) : null}
        </div>
    )
}

function InfoCard({
    label,
    value,
    mono = false,
    isTauri = true,
}: {
    label: string
    value: string
    mono?: boolean
    isTauri?: boolean
}) {
    return (
        <dl className={surfaceClass(isTauri)}>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {label}
            </dt>
            <dd
                className={`mt-2 text-sm text-zinc-900 dark:text-zinc-100 ${mono ? 'break-all font-mono text-xs sm:text-sm' : ''}`}
            >
                {value}
            </dd>
        </dl>
    )
}

function InfoRow({
    label,
    value,
    bordered = true,
}: {
    label: string
    value: string
    bordered?: boolean
}) {
    return (
        <div
            className={
                bordered
                    ? 'flex flex-col gap-1 border-b border-zinc-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800'
                    : 'flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between'
            }
        >
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {label}
            </dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-100">
                {value}
            </dd>
        </div>
    )
}

function UserAvatarLarge({ name }: { name: string }) {
    return (
        <img
            src="https://picsum.photos/200"
            alt={name}
            className="h-16 w-16 shrink-0 rounded-full object-cover shadow-sm sm:h-20 sm:w-20"
        />
    )
}

function ProfileSection({
    authUser,
    authReady,
    t,
}: {
    authUser: AuthUser | null
    authReady: boolean
    t: AccountStrings
}) {
    const isTauri = useTauriDesktop()

    function handleLogout() {
        clearAuthSession()
    }

    if (!authReady) {
        return (
            <PanelShell
                title={t.sectionProfile}
                description={t.profileLoading}
                hideTitle={isTauri}
            />
        )
    }

    if (!authUser) {
        return <AccountAuthPanel />
    }

    const displayName = getAuthDisplayName(authUser)

    return (
        <div className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <UserAvatarLarge name={displayName} />
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl dark:text-zinc-50">
                            {displayName}
                        </h2>
                        <p className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">
                            {authUser.email}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    className={isTauri ? btnSecondary : btnSecondaryWeb}
                    onClick={handleLogout}
                >
                    {t.logout}
                </button>
            </div>
            <dl
                className={`${surfaceClass(isTauri)} mt-6 ${
                    isTauri
                        ? ''
                        : 'divide-y divide-zinc-200/60 dark:divide-zinc-800/60'
                }`}
            >
                <InfoRow
                    label={t.labelNickname}
                    value={displayName}
                    bordered={isTauri}
                />
                <InfoRow
                    label={t.labelEmail}
                    value={authUser.email}
                    bordered={isTauri}
                />
                <InfoRow
                    label={t.labelRole}
                    value={authUser.role}
                    bordered={isTauri}
                />
                {authUser.status !== undefined ? (
                    <InfoRow
                        label={t.labelStatus}
                        value={String(authUser.status)}
                        bordered={isTauri}
                    />
                ) : null}
                {authUser.points > 0 ? (
                    <InfoRow
                        label={t.labelPoints}
                        value={String(authUser.points)}
                        bordered={isTauri}
                    />
                ) : null}
                {authUser.created_at ? (
                    <InfoRow
                        label={t.labelCreatedAt}
                        value={new Date(authUser.created_at).toLocaleString()}
                        bordered={isTauri}
                    />
                ) : null}
            </dl>
        </div>
    )
}

function subscribeLocalStorage(onStoreChange: () => void) {
    window.addEventListener('storage', onStoreChange)
    return () => window.removeEventListener('storage', onStoreChange)
}

function getLocalStorageUsageLabel() {
    return formatBytes(getLocalStorageUsageBytes())
}

function EnvironmentSection({ t }: { t: AccountStrings }) {
    const isTauri = useTauriDesktop()
    const apiUrl = getApiBaseUrl()
    const webStoreUsage = useSyncExternalStore(
        subscribeLocalStorage,
        getLocalStorageUsageLabel,
        () => '0 B',
    )

    return (
        <PanelShell
            title={t.sectionEnvironment}
            description={
                isTauri ? t.environmentDescDesktop : t.environmentDescWeb
            }
            hideTitle={isTauri}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoCard
                    label={t.labelApiUrl}
                    value={apiUrl}
                    mono
                    isTauri={isTauri}
                />
                {ENVIRONMENT_TOOLCHAIN.map((item) => (
                    <InfoCard
                        key={item.key}
                        label={t[TOOLCHAIN_LABELS[item.key]]}
                        value={item.version}
                        mono
                        isTauri={isTauri}
                    />
                ))}
                <InfoCard
                    label={t.labelWebStore}
                    value={webStoreUsage}
                    mono
                    isTauri={isTauri}
                />
                {isTauri ? (
                    <InfoCard
                        label={t.labelAppVersion}
                        value="0.1.0"
                        isTauri={isTauri}
                    />
                ) : null}
            </div>
        </PanelShell>
    )
}

function PlaceholderSection({
    section,
    t,
}: {
    section: AccountSectionId
    t: AccountStrings
}) {
    const isTauri = useTauriDesktop()
    const title = sectionTitle(section, t)
    const isPhoneApi = section.startsWith('phone-api-')
    const description = isPhoneApi
        ? t.phoneApiPlaceholderDesc
        : t.tauriApiPlaceholderDesc
    const body = isPhoneApi
        ? formatAccountTemplate(t.phoneApiPlaceholderBody, { title })
        : t.tauriApiPlaceholderBody

    return (
        <PanelShell title={title} description={description} hideTitle={isTauri}>
            <div
                className={`${surfaceClass(isTauri)} text-sm text-zinc-600 dark:text-zinc-400`}
            >
                {body}
            </div>
        </PanelShell>
    )
}

function AboutSection({ t }: { t: AccountStrings }) {
    const isTauri = useTauriDesktop()

    return (
        <PanelShell
            title={t.sectionAbout}
            description={t.aboutDescription}
            hideTitle={isTauri}
        >
            <div className={`${surfaceClass(isTauri)} space-y-4`}>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {t.aboutBody}
                </p>
                {isTauri ? (
                    <p className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        {t.aboutDesktopBadge}
                    </p>
                ) : null}
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t.aboutOpenSourcePrefix}{' '}
                    <a
                        href="https://github.com/PakePlus/TauriHub"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
                    >
                        GitHub
                    </a>{' '}
                    {t.aboutOpenSourceSuffix}
                </p>
            </div>
        </PanelShell>
    )
}

export function AccountSectionPanel({
    section,
    authUser,
    authReady = true,
}: AccountSectionPanelProps) {
    const locale = useLocaleStore(selectLocale)
    const t = ACCOUNT_STRINGS[locale]

    if (section === 'profile') {
        return (
            <ProfileSection
                authUser={authUser}
                authReady={authReady}
                t={t}
            />
        )
    }
    if (section === 'environment') {
        return <EnvironmentSection t={t} />
    }
    if (section === 'about') {
        return <AboutSection t={t} />
    }
    return <PlaceholderSection section={section} t={t} />
}
