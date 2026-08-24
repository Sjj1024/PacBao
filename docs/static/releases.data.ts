/**
 * Build-time loader for the docs download page.
 * Fetches GitHub Releases during docs:dev / docs:build and exposes
 * normalized assets via the `data` export for instant client render.
 */
import { defineLoader } from 'vitepress'
import {
    emptyReleasesData,
    normalizeReleases,
    RELEASES_URL,
    type GithubRelease,
    type ReleasesData,
} from './parseReleases'

const MAX_ATTEMPTS = 3

declare const data: ReleasesData
export { data }

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchReleases(): Promise<ReleasesData> {
    let lastError: unknown

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
            const res = await fetch(RELEASES_URL, {
                headers: {
                    Accept: 'application/vnd.github+json',
                    'User-Agent': 'PacBao-docs-releases-loader',
                },
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)

            const payload = (await res.json()) as GithubRelease[]
            const normalized = normalizeReleases(payload)
            if (!normalized.assets.length)
                throw new Error('No downloadable assets')
            return normalized
        } catch (error) {
            lastError = error
            if (attempt < MAX_ATTEMPTS) await sleep(attempt * 800)
        }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

export default defineLoader({
    async load(): Promise<ReleasesData> {
        try {
            const snapshot = await fetchReleases()
            console.log(
                `[releases.data] Prefetched ${snapshot.assets.length} assets for ${snapshot.version}`,
            )
            return snapshot
        } catch (error) {
            console.warn(
                '[releases.data] Failed to prefetch GitHub releases:',
                error instanceof Error ? error.message : error,
            )
            return emptyReleasesData()
        }
    },
})
