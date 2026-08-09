'use client'

import { useEffect } from 'react'

export type ToastMessageProps = {
    open: boolean
    message: string
    /** Auto-dismiss duration in ms. Default 3000. */
    durationMs?: number
    onClose: () => void
}

/**
 * Top-center toast. Parent controls `open`; auto-closes after `durationMs`.
 */
export function ToastMessage({
    open,
    message,
    durationMs = 3000,
    onClose,
}: ToastMessageProps) {
    useEffect(() => {
        if (!open) return
        const timer = window.setTimeout(onClose, durationMs)
        return () => clearTimeout(timer)
    }, [open, durationMs, onClose, message])

    if (!open) return null

    return (
        <div
            className="pointer-events-none fixed inset-x-0 top-4 z-100 flex justify-center px-4"
            role="status"
            aria-live="polite"
        >
            <div className="pointer-events-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                {message}
            </div>
        </div>
    )
}
