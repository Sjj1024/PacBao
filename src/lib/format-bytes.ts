export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    )
    const value = bytes / 1024 ** index
    const digits = index === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2
    return `${value.toFixed(digits)} ${units[index]}`
}
