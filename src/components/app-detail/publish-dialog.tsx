'use client'

import {
    useEffect,
    useId,
    useRef,
    useState,
    type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {
    formErrorClass,
    formInputClass,
    formLabelClass,
    formRadioClass,
} from '@/components/app-detail/form-field-styles'
import {
    dialogBackdropClass,
    dialogOverlayPublishClass,
    dialogPanelTallMaxHeightClass,
} from '@/components/dialog-styles'
import {
    DEFAULT_MOBILE_PUBLISH_DIALOG_PLATFORMS,
    DEFAULT_PUBLISH_DIALOG_PLATFORMS,
    DEFAULT_LOCAL_PUBLISH_DIALOG_PLATFORMS,
    PUBLISH_METHOD_LOCAL,
    toLocalPublishPlatform,
    type PublishFormValues,
} from '@/lib/ppconfig'
import { useTauriDesktop } from '@/hooks/use-tauri-desktop'

export type { PublishFormValues }

export type PublishSelectOption = {
    value: string
    label: string
    /** When true, option is shown but cannot be selected. */
    disabled?: boolean
}

export type PublishPlatformGroup = {
    id: string
    label: string
    children: PublishSelectOption[]
}

export type PublishDialogLabels = {
    title: string
    closeAria: string
    methodLabel: string
    platformLabel: string
    platformPlaceholder: string
    debugLabel: string
    debugOff: string
    debugOn: string
    descriptionLabel: string
    descriptionPlaceholder: string
    cancel: string
    confirm: string
    platformRequired: string
    methods: PublishSelectOption[]
    platformGroups: PublishPlatformGroup[]
    /** 移动端：扁平发布平台选项（无分组、无发布方式）。 */
    platformOptions?: PublishSelectOption[]
    /** 本地打包：单选平台（安卓 / 苹果 / WebClip / Windows / macOS）。 */
    localPlatformOptions?: PublishSelectOption[]
}

export type PublishDialogMode = 'desktop' | 'mobile'

type PublishDialogProps = {
    open: boolean
    mode?: PublishDialogMode
    labels: PublishDialogLabels
    initialValues?: Partial<PublishFormValues>
    submitting?: boolean
    submitError?: string
    onClose: () => void
    onConfirm: (values: PublishFormValues) => void | Promise<void>
}

const fieldRowClass = 'flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4'
const labelCellClass = `${formLabelClass} sm:shrink-0 sm:pt-3`
const controlCellClass = 'min-w-0 flex-1'

const publishDropdownTriggerClass = `${formInputClass} flex min-h-12 w-full items-center justify-between gap-2 text-left`

const publishDropdownPanelClass =
    'absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900'

const publishDropdownChevronClass =
    'shrink-0 text-zinc-400 transition-transform dark:text-zinc-500'

const publishDropdownOptionBaseClass =
    'flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors'

const DEFAULT_DESCRIPTION = '打包仅限个人使用，请勿传播或商业用途，否则后果自负'

const platformTagClass =
    'inline-flex max-w-full items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-sm text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'

const MAX_VISIBLE_PLATFORM_TAGS = 3

const checkboxClass =
    'h-4 w-4 shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-blue-500/30 dark:border-zinc-600'

function flattenPlatformOptions(groups: PublishPlatformGroup[]) {
    return groups.flatMap((group) => group.children)
}

function buildExpandedState(groups: PublishPlatformGroup[]) {
    return Object.fromEntries(groups.map((group) => [group.id, true]))
}

function GroupCheckbox({
    checked,
    indeterminate,
    disabled,
    onChange,
}: {
    checked: boolean
    indeterminate: boolean
    disabled?: boolean
    onChange: () => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate
        }
    }, [indeterminate])

    return (
        <input
            ref={inputRef}
            type="checkbox"
            className={checkboxClass}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
        />
    )
}

function IconChevron({ expanded }: { expanded: boolean }) {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-zinc-400 transition-transform ${
                expanded ? 'rotate-0' : '-rotate-90'
            }`}
            aria-hidden
        >
            <path d="M6 9l6 6 6-6" />
        </svg>
    )
}

function IconCheck() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-blue-600 dark:text-blue-400"
            aria-hidden
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}

function PublishDropdownChevron({ open }: { open: boolean }) {
    return (
        <span
            className={`${publishDropdownChevronClass} ${
                open ? 'rotate-180' : ''
            }`}
            aria-hidden
        >
            ▾
        </span>
    )
}

function MethodSingleSelect({
    options,
    value,
    disabled,
    onChange,
}: {
    options: PublishSelectOption[]
    value: string
    disabled?: boolean
    onChange: (value: string) => void
}) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const listboxId = useId()

    const selected = options.find((item) => item.value === value)

    useEffect(() => {
        if (!open) return
        const onPointer = (e: MouseEvent | TouchEvent) => {
            const el = rootRef.current
            if (el && !el.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', onPointer)
        document.addEventListener('touchstart', onPointer)
        return () => {
            document.removeEventListener('mousedown', onPointer)
            document.removeEventListener('touchstart', onPointer)
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open])

    function handleTriggerKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
        if (e.key === 'Escape') {
            setOpen(false)
            return
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled) setOpen((prev) => !prev)
        }
    }

    function selectMethod(methodValue: string) {
        const option = options.find((item) => item.value === methodValue)
        if (option?.disabled) return
        onChange(methodValue)
        setOpen(false)
    }

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                className={publishDropdownTriggerClass}
                onClick={() => {
                    if (!disabled) setOpen((prev) => !prev)
                }}
                onKeyDown={handleTriggerKeyDown}
            >
                <span className="min-w-0 flex-1 truncate py-0.5 text-sm text-zinc-900 dark:text-zinc-50">
                    {selected?.label ?? value}
                </span>
                <PublishDropdownChevron open={open} />
            </button>
            {open ? (
                <ul
                    id={listboxId}
                    role="listbox"
                    aria-label={selected?.label}
                    className={publishDropdownPanelClass}
                >
                    {options.map((item) => {
                        const checked = item.value === value
                        const optionDisabled = Boolean(item.disabled)
                        return (
                            <li
                                key={item.value}
                                role="option"
                                aria-selected={checked}
                                aria-disabled={optionDisabled || undefined}
                            >
                                <button
                                    type="button"
                                    disabled={optionDisabled}
                                    className={`${publishDropdownOptionBaseClass} ${
                                        optionDisabled
                                            ? 'cursor-not-allowed text-zinc-400 opacity-60 dark:text-zinc-500'
                                            : checked
                                              ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                              : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                                    }`}
                                    onClick={() => selectMethod(item.value)}
                                >
                                    <span className="min-w-0 flex-1">
                                        {item.label}
                                    </span>
                                    {checked && !optionDisabled ? (
                                        <IconCheck />
                                    ) : null}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            ) : null}
        </div>
    )
}

function PlatformGroupMultiSelect({
    groups,
    value,
    placeholder,
    disabled,
    onChange,
}: {
    groups: PublishPlatformGroup[]
    value: string[]
    placeholder: string
    disabled?: boolean
    onChange: (next: string[]) => void
}) {
    const [open, setOpen] = useState(false)
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
        buildExpandedState(groups),
    )
    const rootRef = useRef<HTMLDivElement>(null)
    const listboxId = useId()
    const flatOptions = flattenPlatformOptions(groups)

    useEffect(() => {
        setExpanded(buildExpandedState(groups))
    }, [groups])

    useEffect(() => {
        if (!open) return
        const onPointer = (e: MouseEvent | TouchEvent) => {
            const el = rootRef.current
            if (el && !el.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', onPointer)
        document.addEventListener('touchstart', onPointer)
        return () => {
            document.removeEventListener('mousedown', onPointer)
            document.removeEventListener('touchstart', onPointer)
        }
    }, [open])

    function togglePlatform(platformValue: string) {
        onChange(
            value.includes(platformValue)
                ? value.filter((id) => id !== platformValue)
                : [...value, platformValue],
        )
    }

    function toggleGroup(group: PublishPlatformGroup) {
        const childValues = group.children.map((item) => item.value)
        const allSelected = childValues.every((id) => value.includes(id))
        if (allSelected) {
            onChange(value.filter((id) => !childValues.includes(id)))
            return
        }
        onChange([...new Set([...value, ...childValues])])
    }

    function toggleExpanded(groupId: string) {
        setExpanded((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
    }

    function handleTriggerKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
        if (e.key === 'Escape') {
            setOpen(false)
            return
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled) setOpen((prev) => !prev)
        }
    }

    const selectedLabels = value
        .map(
            (platformId) =>
                flatOptions.find((item) => item.value === platformId)?.label ??
                platformId,
        )
        .join(', ')

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                className={publishDropdownTriggerClass}
                onClick={() => {
                    if (!disabled) setOpen((prev) => !prev)
                }}
                onKeyDown={handleTriggerKeyDown}
            >
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 py-0.5">
                    {value.length === 0 ? (
                        <span className="text-zinc-400 dark:text-zinc-500">
                            {placeholder}
                        </span>
                    ) : (
                        <>
                            {value
                                .slice(0, MAX_VISIBLE_PLATFORM_TAGS)
                                .map((platformId) => {
                                    const option = flatOptions.find(
                                        (item) => item.value === platformId,
                                    )
                                    return (
                                        <span
                                            key={platformId}
                                            className={platformTagClass}
                                        >
                                            {option?.label ?? platformId}
                                        </span>
                                    )
                                })}
                            {value.length > MAX_VISIBLE_PLATFORM_TAGS ? (
                                <span className={platformTagClass}>
                                    +{value.length - MAX_VISIBLE_PLATFORM_TAGS}
                                </span>
                            ) : null}
                        </>
                    )}
                </span>
                <PublishDropdownChevron open={open} />
            </button>
            {open ? (
                <ul
                    id={listboxId}
                    role="listbox"
                    aria-multiselectable="true"
                    aria-label={placeholder}
                    className={publishDropdownPanelClass}
                >
                    {groups.map((group) => {
                        const childValues = group.children.map(
                            (item) => item.value,
                        )
                        const selectedCount = childValues.filter((id) =>
                            value.includes(id),
                        ).length
                        const groupChecked =
                            selectedCount === childValues.length &&
                            childValues.length > 0
                        const groupIndeterminate =
                            selectedCount > 0 && !groupChecked
                        const isExpanded = expanded[group.id] !== false

                        return (
                            <li key={group.id} role="presentation">
                                <div className="flex items-center gap-2 px-3 py-2.5">
                                    <button
                                        type="button"
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        aria-expanded={isExpanded}
                                        disabled={disabled}
                                        onClick={() => toggleExpanded(group.id)}
                                    >
                                        <IconChevron expanded={isExpanded} />
                                    </button>
                                    <GroupCheckbox
                                        checked={groupChecked}
                                        indeterminate={groupIndeterminate}
                                        disabled={disabled}
                                        onChange={() => toggleGroup(group)}
                                    />
                                    <button
                                        type="button"
                                        className="min-w-0 flex-1 text-left text-sm font-medium text-zinc-800 dark:text-zinc-100"
                                        disabled={disabled}
                                        aria-expanded={isExpanded}
                                        onClick={() => toggleExpanded(group.id)}
                                    >
                                        {group.label}
                                    </button>
                                </div>
                                {isExpanded ? (
                                    <ul
                                        role="group"
                                        aria-label={group.label}
                                        className="list-none pb-1"
                                    >
                                        {group.children.map((item) => {
                                            const checked = value.includes(
                                                item.value,
                                            )
                                            return (
                                                <li
                                                    key={item.value}
                                                    role="option"
                                                    aria-selected={checked}
                                                >
                                                    <label
                                                        className={`flex cursor-pointer items-center gap-2 py-2.5 pl-11 pr-3 text-sm transition-colors ${
                                                            checked
                                                                ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                                                : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className={
                                                                checkboxClass
                                                            }
                                                            checked={checked}
                                                            disabled={disabled}
                                                            onChange={() =>
                                                                togglePlatform(
                                                                    item.value,
                                                                )
                                                            }
                                                        />
                                                        <span className="min-w-0 flex-1">
                                                            {item.label}
                                                        </span>
                                                        {checked ? (
                                                            <IconCheck />
                                                        ) : (
                                                            <span
                                                                className="w-4 shrink-0"
                                                                aria-hidden
                                                            />
                                                        )}
                                                    </label>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                ) : null}
                            </li>
                        )
                    })}
                </ul>
            ) : null}
            <span className="sr-only" aria-live="polite">
                {value.length > 0 ? selectedLabels : placeholder}
            </span>
        </div>
    )
}

function resolveEnabledMethod(
    labels: PublishDialogLabels,
    preferred?: string,
): string {
    const methods = labels.methods
    const preferredOption = preferred
        ? methods.find((item) => item.value === preferred)
        : undefined
    if (preferredOption && !preferredOption.disabled) {
        return preferredOption.value
    }
    return (
        methods.find((item) => !item.disabled)?.value ??
        methods[0]?.value ??
        PUBLISH_METHOD_LOCAL
    )
}

function buildInitialValues(
    labels: PublishDialogLabels,
    initial?: Partial<PublishFormValues>,
    mode: PublishDialogMode = 'desktop',
): PublishFormValues {
    const method = resolveEnabledMethod(labels, initial?.method)
    const isLocal = mode !== 'mobile' && method === PUBLISH_METHOD_LOCAL
    const defaultPlatforms =
        mode === 'mobile'
            ? [...DEFAULT_MOBILE_PUBLISH_DIALOG_PLATFORMS]
            : isLocal
              ? [...DEFAULT_LOCAL_PUBLISH_DIALOG_PLATFORMS]
              : [...DEFAULT_PUBLISH_DIALOG_PLATFORMS]

    let platforms: string[]
    if (initial?.platforms && initial.platforms.length > 0) {
        platforms =
            mode === 'mobile' || isLocal
                ? [
                      isLocal
                          ? toLocalPublishPlatform(initial.platforms)
                          : initial.platforms[0],
                  ]
                : [...initial.platforms]
    } else {
        platforms = defaultPlatforms
    }

    return {
        method,
        platforms,
        debug: initial?.debug ?? false,
        description: initial?.description?.trim() || DEFAULT_DESCRIPTION,
    }
}

export function PublishDialog({
    open,
    mode = 'desktop',
    labels,
    initialValues,
    submitting = false,
    submitError = '',
    onClose,
    onConfirm,
}: PublishDialogProps) {
    const isTauri = useTauriDesktop()
    const titleId = useId()
    const [values, setValues] = useState<PublishFormValues>(() =>
        buildInitialValues(labels, initialValues, mode),
    )
    const [error, setError] = useState('')
    const wasOpenRef = useRef(false)

    // Only hydrate from props when the dialog opens. Parent re-renders recreate
    // `labels` / `initialValues` every time; resetting while open would wipe the
    // user's platform selection (visible flash on confirm).
    useEffect(() => {
        if (open && !wasOpenRef.current) {
            setValues(buildInitialValues(labels, initialValues, mode))
            setError('')
        }
        wasOpenRef.current = open
    }, [open, labels, initialValues, mode])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !submitting) onClose()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose, submitting])

    if (!open) return null

    function handlePlatformsChange(platforms: string[]) {
        setValues((prev) => ({ ...prev, platforms }))
        if (platforms.length > 0) setError('')
    }

    function handleMethodChange(method: string) {
        if (labels.methods.find((item) => item.value === method)?.disabled) {
            return
        }
        setValues((prev) => {
            const switchingToLocal = method === PUBLISH_METHOD_LOCAL
            const wasLocal = prev.method === PUBLISH_METHOD_LOCAL
            let platforms = prev.platforms
            if (switchingToLocal && !wasLocal) {
                platforms = [toLocalPublishPlatform(prev.platforms)]
            } else if (!switchingToLocal && wasLocal) {
                platforms = [...DEFAULT_PUBLISH_DIALOG_PLATFORMS]
            }
            return { ...prev, method, platforms }
        })
        setError('')
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (values.platforms.length === 0) {
            setError(labels.platformRequired)
            return
        }
        void onConfirm(values)
    }

    const displayError = error || submitError
    const isMobile = mode === 'mobile'
    const isLocalMethod = !isMobile && values.method === PUBLISH_METHOD_LOCAL
    const flatPlatformOptions = labels.platformOptions ?? []
    const localPlatformOptions = labels.localPlatformOptions ?? []

    return (
        <div
            className={dialogOverlayPublishClass}
            role="presentation"
            onClick={submitting ? undefined : onClose}
        >
            <div className={dialogBackdropClass} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`relative z-10 flex w-full max-w-lg shrink-0 flex-col rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 ${dialogPanelTallMaxHeightClass}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative shrink-0 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
                    <h2
                        id={titleId}
                        className="text-center text-lg font-semibold text-zinc-900 dark:text-white"
                    >
                        {labels.title}
                    </h2>
                    <button
                        type="button"
                        className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        aria-label={labels.closeAria}
                        disabled={submitting}
                        onClick={onClose}
                    >
                        <span aria-hidden className="text-xl leading-none">
                            ×
                        </span>
                    </button>
                </div>

                <form
                    className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5"
                    onSubmit={handleSubmit}
                >
                    <div className="flex flex-col gap-5">
                        {!isMobile ? (
                            <div className={fieldRowClass}>
                                <span className={labelCellClass}>
                                    {labels.methodLabel}
                                </span>
                                <div className={controlCellClass}>
                                    <MethodSingleSelect
                                        options={labels.methods}
                                        value={values.method}
                                        disabled={submitting}
                                        onChange={handleMethodChange}
                                    />
                                </div>
                            </div>
                        ) : null}

                        <div className={fieldRowClass}>
                            <span className={labelCellClass}>
                                {labels.platformLabel}
                            </span>
                            <div className={controlCellClass}>
                                {isMobile ? (
                                    <MethodSingleSelect
                                        options={flatPlatformOptions}
                                        value={values.platforms[0] ?? ''}
                                        disabled={submitting}
                                        onChange={(platform) => {
                                            handlePlatformsChange([platform])
                                        }}
                                    />
                                ) : isLocalMethod ? (
                                    <MethodSingleSelect
                                        options={localPlatformOptions}
                                        value={values.platforms[0] ?? ''}
                                        disabled={submitting}
                                        onChange={(platform) => {
                                            handlePlatformsChange([platform])
                                        }}
                                    />
                                ) : (
                                    <PlatformGroupMultiSelect
                                        groups={labels.platformGroups}
                                        value={values.platforms}
                                        placeholder={labels.platformPlaceholder}
                                        disabled={submitting}
                                        onChange={handlePlatformsChange}
                                    />
                                )}
                            </div>
                        </div>

                        <div className={fieldRowClass}>
                            <span className={labelCellClass}>
                                {labels.debugLabel}
                            </span>
                            <div
                                className={`${controlCellClass} flex flex-wrap gap-4 pt-1 sm:pt-3`}
                            >
                                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                                    <input
                                        type="radio"
                                        name="publish-debug"
                                        className={formRadioClass(isTauri)}
                                        checked={!values.debug}
                                        disabled={submitting}
                                        onChange={() =>
                                            setValues((prev) => ({
                                                ...prev,
                                                debug: false,
                                            }))
                                        }
                                    />
                                    {labels.debugOff}
                                </label>
                                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                                    <input
                                        type="radio"
                                        name="publish-debug"
                                        className={formRadioClass(isTauri)}
                                        checked={values.debug}
                                        disabled={submitting}
                                        onChange={() =>
                                            setValues((prev) => ({
                                                ...prev,
                                                debug: true,
                                            }))
                                        }
                                    />
                                    {labels.debugOn}
                                </label>
                            </div>
                        </div>

                        <div className={fieldRowClass}>
                            <span className={labelCellClass}>
                                {labels.descriptionLabel}
                            </span>
                            <div className={controlCellClass}>
                                <textarea
                                    rows={4}
                                    value={values.description}
                                    disabled={submitting}
                                    placeholder={labels.descriptionPlaceholder}
                                    className={`${formInputClass} min-h-[6.5rem] resize-none py-3`}
                                    onChange={(e) =>
                                        setValues((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {displayError ? (
                        <p className={`mt-4 ${formErrorClass}`} role="alert">
                            {displayError}
                        </p>
                    ) : null}

                    <div className="mt-6 flex flex-col-reverse gap-5 sm:flex-row sm:justify-center">
                        <button
                            type="button"
                            disabled={submitting}
                            className="flex h-11 items-center justify-center rounded-xl border border-zinc-200 px-6 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            onClick={onClose}
                        >
                            {labels.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            {labels.confirm}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
