import type { AccountStrings } from '@/locales/account'

export type AccountSectionId =
    | 'profile'
    | 'environment'
    | 'tauri-api-apps'
    | 'tauri-api-cors'
    | 'tauri-api-event'
    | 'phone-api-file'
    | 'phone-api-notification'
    | 'phone-api-location'
    | 'phone-api-camera'
    | 'about'

export const DEFAULT_ACCOUNT_SECTION: AccountSectionId = 'profile'

export type AccountNavItem = {
    id: AccountSectionId
    label: string
    href: string
}

export type AccountNavGroup = {
    id: string
    label: string
    children: AccountNavItem[]
}

const SECTION_PATHS: Record<AccountSectionId, string> = {
    profile: '/account/profile/',
    environment: '/account/environment/',
    'tauri-api-apps': '/account/tauri-api/apps/',
    'tauri-api-cors': '/account/tauri-api/cors/',
    'tauri-api-event': '/account/tauri-api/event/',
    'phone-api-file': '/account/phone-api/file/',
    'phone-api-notification': '/account/phone-api/notification/',
    'phone-api-location': '/account/phone-api/location/',
    'phone-api-camera': '/account/phone-api/camera/',
    about: '/account/about/',
}

function sectionLabels(t: AccountStrings): Record<AccountSectionId, string> {
    return {
        profile: t.sectionProfile,
        environment: t.sectionEnvironment,
        'tauri-api-apps': t.sectionTauriApps,
        'tauri-api-cors': t.sectionTauriCors,
        'tauri-api-event': t.sectionTauriEvent,
        'phone-api-file': t.sectionPhoneFile,
        'phone-api-notification': t.sectionPhoneNotification,
        'phone-api-location': t.sectionPhoneLocation,
        'phone-api-camera': t.sectionPhoneCamera,
        about: t.sectionAbout,
    }
}

export function getAccountAbout(t: AccountStrings) {
    return {
        id: 'about' as const,
        label: t.sectionAbout,
        href: SECTION_PATHS.about,
    }
}

export function getAccountNavGroups(t: AccountStrings): AccountNavGroup[] {
    const labels = sectionLabels(t)
    return [
        {
            id: 'basic',
            label: t.groupBasic,
            children: [
                {
                    id: 'profile',
                    label: labels.profile,
                    href: SECTION_PATHS.profile,
                },
                {
                    id: 'environment',
                    label: labels.environment,
                    href: SECTION_PATHS.environment,
                },
            ],
        },
        {
            id: 'tauri-api',
            label: t.groupTauriApi,
            children: [
                {
                    id: 'tauri-api-apps',
                    label: labels['tauri-api-apps'],
                    href: SECTION_PATHS['tauri-api-apps'],
                },
                {
                    id: 'tauri-api-cors',
                    label: labels['tauri-api-cors'],
                    href: SECTION_PATHS['tauri-api-cors'],
                },
                {
                    id: 'tauri-api-event',
                    label: labels['tauri-api-event'],
                    href: SECTION_PATHS['tauri-api-event'],
                },
            ],
        },
        {
            id: 'phone-api',
            label: t.groupPhoneApi,
            children: [
                {
                    id: 'phone-api-file',
                    label: labels['phone-api-file'],
                    href: SECTION_PATHS['phone-api-file'],
                },
                {
                    id: 'phone-api-notification',
                    label: labels['phone-api-notification'],
                    href: SECTION_PATHS['phone-api-notification'],
                },
                {
                    id: 'phone-api-location',
                    label: labels['phone-api-location'],
                    href: SECTION_PATHS['phone-api-location'],
                },
                {
                    id: 'phone-api-camera',
                    label: labels['phone-api-camera'],
                    href: SECTION_PATHS['phone-api-camera'],
                },
            ],
        },
    ]
}

export function sectionToPath(section: AccountSectionId): string {
    return SECTION_PATHS[section]
}

export function pathnameToSection(pathname: string): AccountSectionId | null {
    const slug = pathname
        .replace(/^\/account\/?/, '')
        .split('/')
        .filter(Boolean)
    return slugToSection(slug.length ? slug : undefined)
}

export function slugToSection(
    slug: string[] | undefined,
): AccountSectionId | null {
    if (!slug?.length) return null
    if (slug.length === 1) {
        if (slug[0] === 'profile') return 'profile'
        if (slug[0] === 'environment') return 'environment'
        if (slug[0] === 'about') return 'about'
        return null
    }
    if (slug.length === 2 && slug[0] === 'tauri-api') {
        if (slug[1] === 'apps') return 'tauri-api-apps'
        if (slug[1] === 'cors') return 'tauri-api-cors'
        if (slug[1] === 'event') return 'tauri-api-event'
    }
    if (slug.length === 2 && slug[0] === 'phone-api') {
        if (slug[1] === 'file') return 'phone-api-file'
        if (slug[1] === 'notification') return 'phone-api-notification'
        if (slug[1] === 'location') return 'phone-api-location'
        if (slug[1] === 'camera') return 'phone-api-camera'
    }
    return null
}

export function sectionTitle(
    section: AccountSectionId,
    t: AccountStrings,
): string {
    return sectionLabels(t)[section] ?? ''
}
