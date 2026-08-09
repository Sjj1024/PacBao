'use client'

import type { ReactNode } from 'react'
import { useTauriDesktop } from '@/hooks/use-tauri-desktop'

export const pageOuterClass =
    'flex min-h-full flex-1 flex-col bg-zinc-50 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100'

export const pageContainerClass =
    'mx-auto flex w-full flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8'

type PageShellProps = {
    children?: ReactNode
}

export function PageShell({ children }: PageShellProps) {
    const isTauri = useTauriDesktop()

    // Tauri locks body overflow; fill the viewport and scroll inside the shell.
    const outerClass = isTauri
        ? 'flex h-dvh flex-col overflow-hidden bg-zinc-50 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100'
        : pageOuterClass

    const containerClass = isTauri
        ? 'mx-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-4'
        : `${pageContainerClass} max-w-6xl lg:py-8`

    return (
        <div className={outerClass}>
            <div className={containerClass}>{children}</div>
        </div>
    )
}
