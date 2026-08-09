'use client'

import {
    dialogBackdropClass,
    dialogOverlayClass,
} from '@/components/dialog-styles'
import { useEffect, useId } from 'react'

export type MessageDialogProps = {
    open: boolean
    title?: string
    message: string
    cancelLabel?: string
    confirmLabel: string
    confirmDanger?: boolean
    loading?: boolean
    onClose: () => void
    onConfirm: () => void
}

const confirmButtonClass =
    'flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60'

export function MessageDialog({
    open,
    title,
    message,
    cancelLabel,
    confirmLabel,
    confirmDanger = false,
    loading = false,
    onClose,
    onConfirm,
}: MessageDialogProps) {
    const titleId = useId()
    const messageId = useId()

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) onClose()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose, loading])

    if (!open) return null

    const labelledBy = title ? titleId : undefined
    const describedBy = messageId

    return (
        <div
            className={dialogOverlayClass}
            role="presentation"
            onClick={loading ? undefined : onClose}
        >
            <div className={dialogBackdropClass} aria-hidden />
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                className="relative z-10 w-full max-w-md shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                onClick={(e) => e.stopPropagation()}
            >
                {title ? (
                    <h2
                        id={titleId}
                        className="text-center text-lg font-semibold text-zinc-900 dark:text-white"
                    >
                        {title}
                    </h2>
                ) : null}
                <p
                    id={messageId}
                    className={`text-center text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 ${
                        title ? 'mt-3' : 'text-base text-zinc-800 dark:text-zinc-100'
                    }`}
                >
                    {message}
                </p>
                <div
                    className={`flex flex-col-reverse gap-2 sm:flex-row sm:justify-center ${
                        title ? 'mt-6' : 'mt-5'
                    }`}
                >
                    {cancelLabel ? (
                        <button
                            type="button"
                            disabled={loading}
                            className="flex h-11 items-center justify-center rounded-xl border border-zinc-200 px-6 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            onClick={onClose}
                        >
                            {cancelLabel}
                        </button>
                    ) : null}
                    <button
                        type="button"
                        disabled={loading}
                        className={`${confirmButtonClass} ${
                            confirmDanger
                                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                        }`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
