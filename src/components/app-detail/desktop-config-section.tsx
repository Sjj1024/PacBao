'use client'

import { useState } from 'react'
import {
    formInputClass,
    formLabelClass,
} from '@/components/app-detail/form-field-styles'

export const DESKTOP_FEATURE_KEYS = [
    'keepWindow',
    'singleton',
    'disableContextMenu',
    'allowCors',
    'bootAutoStart',
] as const

export type DesktopFeatureKey = (typeof DESKTOP_FEATURE_KEYS)[number]

/** Window option keys; default checked state matches common Tauri defaults. */
export const DESKTOP_WINDOW_OPTION_KEYS = [
    'dragDropEnabled',
    'center',
    'closable',
    'resizable',
    'fullscreen',
    'focus',
    'transparent',
    'maximized',
    'visible',
    'decorations',
    'alwaysOnTop',
    'alwaysOnBottom',
    'contentProtected',
    'skipTaskbar',
    'shadow',
    'maximizable',
    'minimizable',
    'acceptFirstMouse',
    'hiddenTitle',
    'tauriApi',
    'zoomHotkeysEnabled',
    'backgroundThrottling',
    'javascriptDisabled',
    'incognito',
] as const

export type DesktopWindowOptionKey =
    (typeof DESKTOP_WINDOW_OPTION_KEYS)[number]

export type DesktopConfigLabels = {
    featuresTitle: string
    windowOptionsTitle: string
    features: Record<DesktopFeatureKey, string>
    windowOptions: Record<DesktopWindowOptionKey, string>
    additionalBrowserArgsLabel: string
    additionalBrowserArgsPlaceholder: string
}

type DesktopConfigSectionProps = {
    labels: DesktopConfigLabels
    additionalBrowserArgs: string
    onAdditionalBrowserArgsChange: (value: string) => void
}

const cardClass =
    'rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-700 dark:bg-zinc-900'

const cardTitleClass =
    'text-base font-semibold tracking-tight text-zinc-900 dark:text-white'

const checkboxClass =
    'h-4 w-4 shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-blue-500/30 dark:border-zinc-600'

const DEFAULT_FEATURES: Record<DesktopFeatureKey, boolean> = {
    keepWindow: true,
    singleton: true,
    disableContextMenu: false,
    allowCors: false,
    bootAutoStart: false,
}

const DEFAULT_WINDOW_OPTIONS: Record<DesktopWindowOptionKey, boolean> = {
    dragDropEnabled: true,
    center: false,
    closable: true,
    resizable: true,
    fullscreen: false,
    focus: true,
    transparent: false,
    maximized: true,
    visible: true,
    decorations: true,
    alwaysOnTop: false,
    alwaysOnBottom: false,
    contentProtected: false,
    skipTaskbar: false,
    shadow: true,
    maximizable: true,
    minimizable: true,
    acceptFirstMouse: false,
    hiddenTitle: false,
    tauriApi: true,
    zoomHotkeysEnabled: false,
    backgroundThrottling: false,
    javascriptDisabled: false,
    incognito: false,
}

function CheckboxRow({
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

/** Desktop config UI: feature + window option checkboxes. Local state only
 *  except additionalBrowserArgs which is owned by the parent form. */
export function DesktopConfigSection({
    labels,
    additionalBrowserArgs,
    onAdditionalBrowserArgsChange,
}: DesktopConfigSectionProps) {
    const [features, setFeatures] = useState(DEFAULT_FEATURES)
    const [windowOptions, setWindowOptions] = useState(DEFAULT_WINDOW_OPTIONS)

    function setFeature(key: DesktopFeatureKey, next: boolean) {
        setFeatures((prev) => ({ ...prev, [key]: next }))
    }

    function setWindowOption(key: DesktopWindowOptionKey, next: boolean) {
        setWindowOptions((prev) => ({ ...prev, [key]: next }))
    }

    return (
        <div className="flex w-full flex-col gap-5">
            <section
                className={cardClass}
                aria-labelledby="desktop-features-title"
            >
                <h3 id="desktop-features-title" className={cardTitleClass}>
                    {labels.featuresTitle}
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {DESKTOP_FEATURE_KEYS.map((key) => (
                        <CheckboxRow
                            key={key}
                            id={`desktop-feature-${key}`}
                            label={labels.features[key]}
                            checked={features[key]}
                            onChange={(next) => setFeature(key, next)}
                        />
                    ))}
                </div>
            </section>

            <section
                className={cardClass}
                aria-labelledby="desktop-window-options-title"
            >
                <h3
                    id="desktop-window-options-title"
                    className={cardTitleClass}
                >
                    {labels.windowOptionsTitle}
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {DESKTOP_WINDOW_OPTION_KEYS.map((key) => (
                        <CheckboxRow
                            key={key}
                            id={`desktop-window-${key}`}
                            label={labels.windowOptions[key]}
                            checked={windowOptions[key]}
                            onChange={(next) => setWindowOption(key, next)}
                        />
                    ))}
                </div>
            </section>

            <section className={cardClass}>
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="additional-browser-args"
                        className={formLabelClass}
                    >
                        {labels.additionalBrowserArgsLabel}
                    </label>
                    <input
                        id="additional-browser-args"
                        type="text"
                        value={additionalBrowserArgs}
                        onChange={(e) =>
                            onAdditionalBrowserArgsChange(e.target.value)
                        }
                        className={formInputClass}
                        placeholder={labels.additionalBrowserArgsPlaceholder}
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>
            </section>
        </div>
    )
}
