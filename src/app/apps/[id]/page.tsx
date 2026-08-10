import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AppDetailPageClient } from '@/components/app-detail/app-detail-page-client'

export const metadata: Metadata = {
    title: 'Edit APP',
    description: 'Edit local packager project',
}

/** Static-export placeholder; real ids are passed as `?id=` (see appDetailHref). */
export function generateStaticParams() {
    return [{ id: '_' }]
}

export default function AppDetailPage() {
    return (
        <Suspense fallback={null}>
            <AppDetailPageClient />
        </Suspense>
    )
}
