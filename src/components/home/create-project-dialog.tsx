'use client'

import {
    dialogBackdropClass,
    dialogOverlayClass,
} from '@/components/dialog-styles'
import { useEffect, useId, useRef, useState } from 'react'

type CreateProjectDialogProps = {
    open: boolean
    title: string
    nameLabel: string
    namePlaceholder: string
    cancelLabel: string
    confirmLabel: string
    nameRequiredError: string
    submitting?: boolean
    submitError?: string
    onClose: () => void
    onConfirm: (name: string) => void | Promise<void>
}

export function CreateProjectDialog({
    open,
    title,
    nameLabel,
    namePlaceholder,
    cancelLabel,
    confirmLabel,
    nameRequiredError,
    submitting = false,
    submitError = '',
    onClose,
    onConfirm,
}: CreateProjectDialogProps) {
    const titleId = useId()
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!open) return
        const t = window.setTimeout(() => inputRef.current?.focus(), 0)
        return () => window.clearTimeout(t)
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !submitting) onClose()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose, submitting])

    if (!open) return null

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmed = name.trim()
        if (!trimmed) {
            setError(nameRequiredError)
            return
        }
        void onConfirm(trimmed)
    }

    const displayError = error || submitError

    return (
        <div
            className={dialogOverlayClass}
            role="presentation"
            onClick={submitting ? undefined : onClose}
        >
            <div className={dialogBackdropClass} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative z-10 w-full max-w-md shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                onClick={(e) => e.stopPropagation()}
            >
                <h2
                    id={titleId}
                    className="text-lg font-semibold text-zinc-900 dark:text-white text-center"
                >
                    {title}
                </h2>
                <form
                    className="mt-5 flex flex-col gap-4"
                    onSubmit={handleSubmit}
                >
                    <div className="flex flex-col gap-2">
                        <input
                            ref={inputRef}
                            id="project-name-input"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                if (error) setError('')
                            }}
                            placeholder={namePlaceholder}
                            autoComplete="off"
                            aria-invalid={displayError ? 'true' : 'false'}
                            disabled={submitting}
                            className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-base text-zinc-900 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/30"
                        />
                        {displayError ? (
                            <p
                                className="text-sm text-red-600 dark:text-red-400"
                                role="alert"
                            >
                                {displayError}
                            </p>
                        ) : null}
                    </div>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row justify-center">
                        <button
                            type="button"
                            disabled={submitting}
                            className="flex h-11 items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            onClick={onClose}
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
