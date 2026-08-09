import type { Metadata } from 'next'
import { SettingsPageClient } from '@/components/settings/settings-page-client'

export const metadata: Metadata = {
    title: 'Settings',
    description: 'PakePlus desktop packager settings',
}

export default function SettingsPage() {
    return <SettingsPageClient />
}
