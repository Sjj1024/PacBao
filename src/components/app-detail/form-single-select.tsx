'use client'

import {
    useEffect,
    useId,
    useRef,
    useState,
    type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { formInputClass } from '@/components/app-detail/form-field-styles'

export type FormSelectOption = {
    value: string
    label: string
}

const dropdownTriggerClass = `${formInputClass} flex min-h-12 w-full items-center justify-between gap-2 text-left`

const dropdownPanelClass =
    'absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900'

const dropdownOptionBaseClass =
    'flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors'

function DropdownChevron({ open }: { open: boolean }) {
    return (
        <span
            className={`shrink-0 text-zinc-400 transition-transform dark:text-zinc-500 ${
                open ? 'rotate-180' : ''
            }`}
            aria-hidden
        >
            ▾
        </span>
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

type FormSingleSelectProps = {
    options: FormSelectOption[]
    value: string
    disabled?: boolean
    'aria-label'?: string
    onChange: (value: string) => void
}

/** Single-select dropdown matching the publish-method control style. */
export function FormSingleSelect({
    options,
    value,
    disabled,
    'aria-label': ariaLabel,
    onChange,
}: FormSingleSelectProps) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const listboxId = useId()
    const selected = options.find((item) => item.value === value)

    useEffect(() => {
        if (!open) return
        const onPointer = (e: MouseEvent | TouchEvent) => {
            const el = rootRef.current
            if (el && !el.contains(e.target as Node)) setOpen(false)
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
        const onKey = (e: KeyboardEvent) => {
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

    function selectOption(next: string) {
        onChange(next)
        setOpen(false)
    }

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                className={dropdownTriggerClass}
                onClick={() => {
                    if (!disabled) setOpen((prev) => !prev)
                }}
                onKeyDown={handleTriggerKeyDown}
            >
                <span className="min-w-0 flex-1 truncate py-0.5 text-sm text-zinc-900 dark:text-zinc-50">
                    {selected?.label ?? value}
                </span>
                <DropdownChevron open={open} />
            </button>
            {open ? (
                <ul
                    id={listboxId}
                    role="listbox"
                    aria-label={ariaLabel ?? selected?.label}
                    className={dropdownPanelClass}
                >
                    {options.map((item) => {
                        const checked = item.value === value
                        return (
                            <li
                                key={item.value}
                                role="option"
                                aria-selected={checked}
                            >
                                <button
                                    type="button"
                                    className={`${dropdownOptionBaseClass} ${
                                        checked
                                            ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                            : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                                    }`}
                                    onClick={() => selectOption(item.value)}
                                >
                                    <span className="min-w-0 flex-1">
                                        {item.label}
                                    </span>
                                    {checked ? <IconCheck /> : null}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            ) : null}
        </div>
    )
}
