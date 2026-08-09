import type { Metadata } from 'next'
import { AppDetailPageClient } from '@/components/app-detail/app-detail-page-client'

export const metadata: Metadata = {
    title: 'Edit APP',
    description: 'Edit local packager project',
}

export function generateStaticParams() {
    return [{ id: '_' }]
}

export default function AppDetailPage() {
    return <AppDetailPageClient />
}
