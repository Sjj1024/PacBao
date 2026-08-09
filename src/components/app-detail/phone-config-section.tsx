'use client'

import { useState } from 'react'
import {
    formInputClass,
    formLabelClass,
} from '@/components/app-detail/form-field-styles'

export const PHONE_PERMISSION_KEYS = [
    'networkAccess',
    'downloadFiles',
    'debugDev',
    'location',
    'photosFiles',
    'disableCache',
    'cameraVideo',
    'backgroundPlay',
    'videoFullscreen',
    'preventScreenshot',
    'bluetooth',
    'openExternalApp',
    'notifications',
    'vibration',
    'clipboard',
    'phoneCall',
    'microphone',
    'keepScreenOn',
    'bootAutoStart',
    'swipeBack',
] as const

export type PhonePermissionKey = (typeof PHONE_PERMISSION_KEYS)[number]

export type PhoneConfigLabels = {
    permissionsTitle: string
    webClipTitle: string
    permissions: Record<PhonePermissionKey, string>
    webClipFullscreen: string
    webClipAllowDelete: string
    webClipOrgName: string
    webClipOrgNamePlaceholder: string
    webClipDesc: string
    webClipDescPlaceholder: string
}

type PhoneConfigSectionProps = {
    labels: PhoneConfigLabels
}

const cardClass =
    'rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-700 dark:bg-zinc-900'

const cardTitleClass =
    'text-base font-semibold tracking-tight text-zinc-900 dark:text-white'

const checkboxClass =
    'h-4 w-4 shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-blue-500/30 dark:border-zinc-600'

function PermissionRow({
    id,
    label,
    checked,
    onChange,
}: {
    id: string
    label: string
    checked: boolean
    onChange: (next: boolean) => void
}) {
    return (
        <label
            htmlFor={id}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
        >
            <input
                id={id}
                type="checkbox"
                className={checkboxClass}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className="min-w-0 text-sm text-zinc-800 dark:text-zinc-200">
                {label}
            </span>
        </label>
    )
}

function createDefaultPermissions(): Record<PhonePermissionKey, boolean> {
    return Object.fromEntries(
        PHONE_PERMISSION_KEYS.map((key) => [key, false]),
    ) as Record<PhonePermissionKey, boolean>
}

/** Phone config UI: permission checkboxes + WebClip settings. Local state only. */
export function PhoneConfigSection({ labels }: PhoneConfigSectionProps) {
    const [permissions, setPermissions] = useState(createDefaultPermissions)
    const [webClipFullscreen, setWebClipFullscreen] = useState(false)
    const [webClipAllowDelete, setWebClipAllowDelete] = useState(true)
    const [orgName, setOrgName] = useState('')
    const [webClipDesc, setWebClipDesc] = useState('')

    function setPermission(key: PhonePermissionKey, next: boolean) {
        setPermissions((prev) => ({ ...prev, [key]: next }))
    }

    return (
        <div className="flex w-full flex-col gap-5">
            <section className={cardClass} aria-labelledby="phone-perm-title">
                <h3 id="phone-perm-title" className={cardTitleClass}>
                    {labels.permissionsTitle}
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {PHONE_PERMISSION_KEYS.map((key) => (
                        <PermissionRow
                            key={key}
                            id={`phone-perm-${key}`}
                            label={labels.permissions[key]}
                            checked={permissions[key]}
                            onChange={(next) => setPermission(key, next)}
                        />
                    ))}
                </div>
            </section>

            <section
                className={cardClass}
                aria-labelledby="phone-webclip-title"
            >
                <h3 id="phone-webclip-title" className={cardTitleClass}>
                    {labels.webClipTitle}
                </h3>
                <div className="mt-4 flex flex-col gap-5">
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        <PermissionRow
                            id="webclip-fullscreen"
                            label={labels.webClipFullscreen}
                            checked={webClipFullscreen}
                            onChange={setWebClipFullscreen}
                        />
                        <PermissionRow
                            id="webclip-allow-delete"
                            label={labels.webClipAllowDelete}
                            checked={webClipAllowDelete}
                            onChange={setWebClipAllowDelete}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="webclip-org-name"
                                className={formLabelClass}
                            >
                                {labels.webClipOrgName}
                            </label>
                            <input
                                id="webclip-org-name"
                                type="text"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                className={formInputClass}
                                placeholder={labels.webClipOrgNamePlaceholder}
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="webclip-desc"
                                className={formLabelClass}
                            >
                                {labels.webClipDesc}
                            </label>
                            <input
                                id="webclip-desc"
                                type="text"
                                value={webClipDesc}
                                onChange={(e) => setWebClipDesc(e.target.value)}
                                className={formInputClass}
                                placeholder={labels.webClipDescPlaceholder}
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
