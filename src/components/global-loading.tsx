'use client'

import { HOME_STRINGS } from '@/locales/home'
import { selectLocale, useLocaleStore } from '@/stores/locale-store'
import { selectIsGlobalLoading, useLoadingStore } from '@/stores/loading-store'
import {
    selectPacking,
    selectPackMessage,
    usePackStore,
} from '@/stores/pack-store'

export function GlobalLoading() {
    const loading = useLoadingStore(selectIsGlobalLoading)
    const packing = usePackStore(selectPacking)
    const packMessage = usePackStore(selectPackMessage)
    const locale = useLocaleStore(selectLocale)
    const label =
        packing && packMessage
            ? packMessage
            : HOME_STRINGS[locale].loadingProjects

    if (!loading && !packing) return null

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 dark:bg-black/40"
            aria-busy="true"
            aria-live="polite"
            role="status"
        >
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-8 py-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <span
                    className="size-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200"
                    aria-hidden
                />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {label}
                </p>
            </div>
        </div>
    )
}
