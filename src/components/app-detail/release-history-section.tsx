'use client'

import { useCallback, useEffect, useState } from 'react'
import { DownloadQrCode } from '@/components/app-detail/download-qr-code'
import {
    BuildTaskApiError,
    getBuildTaskDetail,
} from '@/lib/build-task-api'
import { mapBuildTaskDetailToReleases } from '@/lib/build-task-releases'
import { formatBytes } from '@/lib/format-bytes'
import type { AppRelease, AppReleaseTypeLabels } from '@/lib/release-types'
import type { HomeLocale } from '@/locales/home'

const btnSecondary =
    'inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'

export type ReleaseHistoryLabels = {
    title: string
    colAppName: string
    colDownloadQr: string
    colAppType: string
    colAppSize: string
    colPublishedAt: string
    colActions: string
    download: string
    empty: string
    loading: string
    loadFailed: string
    refresh: string
    qrCodeAria: string
    appTypes: AppReleaseTypeLabels
}

type ReleaseHistorySectionProps = {
    projectId: string
    locale: HomeLocale
    labels: ReleaseHistoryLabels
}

function formatPublishedAt(timestamp: number, locale: HomeLocale) {
    if (!timestamp) return '—'
    return new Date(timestamp).toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function appTypeLabel(type: string, labels: AppReleaseTypeLabels) {
    return labels[type] ?? type
}

function ReleaseDownloadAction({
    release,
    labels,
}: {
    release: AppRelease
    labels: ReleaseHistoryLabels
}) {
    const canDownload = Boolean(release.downloadUrl)

    if (!canDownload) {
        return (
            <button type="button" className={btnSecondary} disabled>
                {labels.download}
            </button>
        )
    }

    return (
        <a
            href={release.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className={btnSecondary}
        >
            {labels.download}
        </a>
    )
}

export function ReleaseHistorySection({
    projectId,
    locale,
    labels,
}: ReleaseHistorySectionProps) {
    const [releases, setReleases] = useState<AppRelease[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const loadReleases = useCallback(
        async (showLoading: boolean) => {
            const proId = Number(projectId)
            if (!projectId || !Number.isFinite(proId) || proId <= 0) {
                setReleases([])
                setError('')
                setLoading(false)
                return
            }

            if (showLoading) setLoading(true)
            setError('')

            try {
                const detail = await getBuildTaskDetail(proId)
                setReleases(
                    detail
                        ? mapBuildTaskDetailToReleases(projectId, detail)
                        : [],
                )
            } catch (err) {
                setReleases([])
                setError(
                    err instanceof BuildTaskApiError
                        ? err.message
                        : labels.loadFailed,
                )
            } finally {
                setLoading(false)
            }
        },
        [projectId, labels.loadFailed],
    )

    useEffect(() => {
        void loadReleases(true)
    }, [loadReleases])

    return (
        <div className="flex w-full flex-col">
            <div>
                {loading ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {labels.loading}
                    </p>
                ) : error ? (
                    <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                        {error}
                    </p>
                ) : releases.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {labels.empty}
                    </p>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 md:block">
                            <table className="w-full min-w-[880px] text-left text-sm">
                                <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            {labels.colAppName}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {labels.colDownloadQr}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {labels.colAppType}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {labels.colAppSize}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {labels.colPublishedAt}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {labels.colActions}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {releases.map((release) => (
                                        <tr
                                            key={release.id}
                                            className="bg-white dark:bg-zinc-950"
                                        >
                                            <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                                                {release.name || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <DownloadQrCode
                                                    url={release.downloadUrl}
                                                    label={labels.qrCodeAria}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                                                {appTypeLabel(
                                                    release.appType,
                                                    labels.appTypes,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                                                {formatBytes(release.sizeBytes)}
                                            </td>
                                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                                                {formatPublishedAt(
                                                    release.publishedAt,
                                                    locale,
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <ReleaseDownloadAction
                                                    release={release}
                                                    labels={labels}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <ul className="flex flex-col gap-3 md:hidden">
                            {releases.map((release) => (
                                <li
                                    key={release.id}
                                    className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                                {release.name || '—'}
                                            </p>
                                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                                {appTypeLabel(
                                                    release.appType,
                                                    labels.appTypes,
                                                )}
                                                {' · '}
                                                {formatBytes(release.sizeBytes)}
                                            </p>
                                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                {formatPublishedAt(
                                                    release.publishedAt,
                                                    locale,
                                                )}
                                            </p>
                                        </div>
                                        <DownloadQrCode
                                            url={release.downloadUrl}
                                            label={labels.qrCodeAria}
                                        />
                                    </div>
                                    <div className="mt-3">
                                        <ReleaseDownloadAction
                                            release={release}
                                            labels={labels}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </div>
    )
}
