'use client'

type DownloadQrCodeProps = {
    url: string
    label: string
    className?: string
}

function qrImageSrc(url: string) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=72x72&margin=1&data=${encodeURIComponent(url)}`
}

export function DownloadQrCode({ url, label, className }: DownloadQrCodeProps) {
    if (!url) {
        return <span className="text-sm text-zinc-400">—</span>
    }

    return (
        <img
            src={qrImageSrc(url)}
            alt={label}
            width={72}
            height={72}
            loading="lazy"
            decoding="async"
            className={
                className ??
                'rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
            }
        />
    )
}
