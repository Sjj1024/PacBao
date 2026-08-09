/** Display versions shown on the account Environment page. */
export const ENVIRONMENT_TOOLCHAIN = [
    { key: 'rust', version: 'v1.83.0' },
    { key: 'node', version: 'v18.16.0' },
    { key: 'npm', version: 'v10.9.0' },
    { key: 'java', version: 'v1.8.0' },
    { key: 'python', version: 'v3.10.0' },
    { key: 'cpp', version: 'v11.0.0' },
    { key: 'web', version: 'web10' },
] as const

export type EnvironmentToolchainKey =
    (typeof ENVIRONMENT_TOOLCHAIN)[number]['key']

/**
 * Approximate localStorage usage in bytes.
 * Browsers store strings as UTF-16, so each character counts as 2 bytes.
 */
export function getLocalStorageUsageBytes(): number {
    if (typeof localStorage === 'undefined') return 0

    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        const value = localStorage.getItem(key) ?? ''
        total += (key.length + value.length) * 2
    }
    return total
}
