'use client'

import { useEffect } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { openExternal } from '@/lib/open-external'

/** Open external links via the system browser in the desktop shell. */
export function TauriBootstrap() {
    useEffect(() => {
        if (!isTauri()) return

        document.documentElement.dataset.tauri = 'true'

        function handleClick(event: MouseEvent) {
            const target = event.target
            if (!(target instanceof Element)) return

            const anchor = target.closest('a[href]')
            if (!(anchor instanceof HTMLAnchorElement)) return
            if (anchor.target !== '_blank') return

            const href = anchor.href
            if (!href || href.startsWith('blob:') || href.startsWith('data:')) {
                return
            }

            event.preventDefault()
            void openExternal(href)
        }

        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [])

    return null
}
