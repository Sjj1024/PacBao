'use client'

import {
    dialogBackdropClass,
    dialogOverlayClass,
} from '@/components/dialog-styles'
import { useTauriDesktop } from '@/hooks/use-tauri-desktop'
import { openExternal } from '@/lib/open-external'
import {
    getNoticeFingerprint,
    getNoticeLink,
    getNoticeNote,
    getUpdateTips,
    hasShownNotice,
    isVersionNewer,
    markNoticeShown,
    parseUpdateManifestExtras,
    type UpdateManifestExtras,
} from '@/lib/update-manifest'
import { HOME_STRINGS } from '@/locales/home'
import {
    selectLocale,
    useLocaleStore,
} from '@/stores/locale-store'
import { relaunch } from '@tauri-apps/plugin-process'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

type DialogMode = 'update' | 'notice'

/**
 * On launch: `check()` → read `Update.rawJson`.
 * Newer remote version → update dialog (`update` / `forceUpdate`).
 * Otherwise → notice when `showNote` (`note` / `noteRepeat` / `noteLink`).
 */
export function AppUpdater() {
    const isDesktop = useTauriDesktop()
    const locale = useLocaleStore(selectLocale)
    const strings = HOME_STRINGS[locale]

    const [mode, setMode] = useState<DialogMode>('update')
    const [pending, setPending] = useState<Update | null>(null)
    const [extras, setExtras] = useState<UpdateManifestExtras | null>(null)
    const [open, setOpen] = useState(false)
    const [installing, setInstalling] = useState(false)
    const [error, setError] = useState(false)
    const [progressPercent, setProgressPercent] = useState('0.00')

    const pendingRef = useRef<Update | null>(null)
    const titleId = useId()
    const messageId = useId()

    const force = mode === 'update' && extras?.forceUpdate === true
    const tips = useMemo(
        () => (extras ? getUpdateTips(extras, locale) : ''),
        [extras, locale]
    )
    const noticeNote = useMemo(
        () => (extras ? getNoticeNote(extras, locale) : ''),
        [extras, locale]
    )
    const noticeLink = useMemo(
        () => (extras ? getNoticeLink(extras, locale) : ''),
        [extras, locale]
    )
    const noticeFingerprint =
        extras && noticeNote ? getNoticeFingerprint(extras, noticeNote) : ''

    useEffect(() => {
        pendingRef.current = pending
    }, [pending])

    useEffect(() => {
        if (!isDesktop) return

        let cancelled = false

        void (async () => {
            let update: Update | null = null
            try {
                update = await check()
            } catch {
                return
            }

            if (cancelled || !update) {
                if (update) void update.close()
                return
            }

            const raw = parseUpdateManifestExtras(update.rawJson)

            if (isVersionNewer(update.version, update.currentVersion)) {
                if (cancelled) {
                    await update.close()
                    return
                }
                setPending(update)
                setExtras(raw)
                setMode('update')
                setOpen(true)
                return
            }

            // No upgrade: use the same rawJson for notice, then release the Update.
            await update.close()
            if (cancelled) return
            if (!raw.showNote) return

            const currentLocale = useLocaleStore.getState().locale
            const note = getNoticeNote(raw, currentLocale)
            if (!note) return

            const fingerprint = getNoticeFingerprint(raw, note)
            if (!raw.noteRepeat && hasShownNotice(fingerprint)) return

            setExtras(raw)
            setMode('notice')
            setOpen(true)
        })()

        return () => {
            cancelled = true
            const current = pendingRef.current
            if (current) {
                void current.close()
            }
        }
    }, [isDesktop])

    const dismissUpdate = useCallback(() => {
        if (force || installing) return
        setOpen(false)
        const current = pending
        setPending(null)
        setExtras(null)
        if (current) void current.close()
    }, [force, installing, pending])

    const dismissNotice = useCallback(() => {
        if (extras && !extras.noteRepeat && noticeFingerprint) {
            markNoticeShown(noticeFingerprint)
        }
        setOpen(false)
        setExtras(null)
    }, [extras, noticeFingerprint])

    const confirmNotice = useCallback(() => {
        const link = noticeLink
        dismissNotice()
        if (link) void openExternal(link)
    }, [dismissNotice, noticeLink])

    const upgrade = useCallback(async () => {
        if (!pending || installing) return
        setInstalling(true)
        setError(false)
        setProgressPercent('0.00')

        let downloaded = 0
        let contentLength = 0

        try {
            await pending.downloadAndInstall((event) => {
                switch (event.event) {
                    case 'Started':
                        contentLength = event.data.contentLength ?? 0
                        break
                    case 'Progress':
                        downloaded += event.data.chunkLength
                        if (contentLength > 0) {
                            setProgressPercent(
                                ((downloaded / contentLength) * 100).toFixed(2)
                            )
                        }
                        break
                    case 'Finished':
                        setProgressPercent('100.00')
                        break
                }
            })
            await relaunch()
        } catch {
            setError(true)
            setInstalling(false)
        }
    }, [pending, installing])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return
            if (mode === 'update' && !force && !installing) dismissUpdate()
            if (mode === 'notice') dismissNotice()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, mode, force, installing, dismissUpdate, dismissNotice])

    if (!open) return null

    if (mode === 'notice') {
        return (
            <div
                className={dialogOverlayClass}
                role="presentation"
                onClick={dismissNotice}
            >
                <div className={dialogBackdropClass} aria-hidden />
                <div
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    aria-describedby={messageId}
                    className="relative z-10 w-full max-w-md shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2
                        id={titleId}
                        className="text-center text-lg font-semibold text-zinc-900 dark:text-white"
                    >
                        {strings.noticeTitle}
                    </h2>
                    <p
                        id={messageId}
                        className="mt-3 whitespace-pre-wrap text-center text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
                    >
                        {noticeNote}
                    </p>
                    <div className="mt-6 flex justify-center">
                        <button
                            type="button"
                            className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                            onClick={confirmNotice}
                        >
                            {strings.confirm}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const canDismiss = !force && !installing

    return (
        <div
            className={dialogOverlayClass}
            role="presentation"
            onClick={canDismiss ? dismissUpdate : undefined}
        >
            <div className={dialogBackdropClass} aria-hidden />
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={messageId}
                className="relative z-10 w-full max-w-md shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                onClick={(e) => e.stopPropagation()}
            >
                <h2
                    id={titleId}
                    className="text-center text-lg font-semibold text-zinc-900 dark:text-white"
                >
                    {strings.updateTitle}
                </h2>
                <p
                    id={messageId}
                    className="mt-3 whitespace-pre-wrap text-center text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
                >
                    {tips || strings.updateAvailableFallback}
                </p>

                {installing ? (
                    <div className="mt-4">
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                                className="h-full rounded-full bg-blue-600 transition-[width] duration-150 dark:bg-blue-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                            {strings.updating} {progressPercent}%
                        </p>
                    </div>
                ) : null}

                {error ? (
                    <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
                        {strings.updateFailed}
                    </p>
                ) : null}

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                    {!force ? (
                        <button
                            type="button"
                            disabled={installing}
                            className="flex h-11 items-center justify-center rounded-xl border border-zinc-200 px-6 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            onClick={dismissUpdate}
                        >
                            {strings.cancel}
                        </button>
                    ) : null}
                    <button
                        type="button"
                        disabled={installing}
                        className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
                        onClick={() => void upgrade()}
                    >
                        {installing ? strings.updating : strings.confirm}
                    </button>
                </div>
            </div>
        </div>
    )
}
