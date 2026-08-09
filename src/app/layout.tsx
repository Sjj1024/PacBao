import type { Metadata } from 'next'
import Script from 'next/script'
import { Geist, Geist_Mono } from 'next/font/google'
import { AppUpdater } from '@/components/app-updater'
import { GlobalLoading } from '@/components/global-loading'
import { TauriBootstrap } from '@/components/tauri-bootstrap'
import { ThemeSync } from '@/components/theme-sync'
import { THEME_BOOT_SCRIPT } from '@/stores/theme-store'
import './globals.css'

const googleTagId = process.env.NEXT_PUBLIC_GTAG?.trim()

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'PacBao',
    description: 'Local multi-platform template packager',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="zh-CN"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
            suppressHydrationWarning
        >
            <body className="min-h-full flex flex-col">
                <Script
                    id="theme-boot"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
                />
                {googleTagId && (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
                                googleTagId
                            )}`}
                            strategy="afterInteractive"
                        />
                        <Script
                            id="google-analytics"
                            strategy="afterInteractive"
                            dangerouslySetInnerHTML={{
                                __html: `
                                    window.dataLayer = window.dataLayer || [];
                                    function gtag(){dataLayer.push(arguments);}
                                    gtag('js', new Date());
                                    gtag('config', ${JSON.stringify(
                                        googleTagId
                                    )});
                                `,
                            }}
                        />
                    </>
                )}
                <ThemeSync />
                <TauriBootstrap />
                <AppUpdater />
                <GlobalLoading />
                {children}
            </body>
        </html>
    )
}
