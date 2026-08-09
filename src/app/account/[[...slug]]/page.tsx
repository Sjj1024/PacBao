import type { Metadata } from 'next'
import { AccountSectionContent } from '@/components/account/account-section-content'
import { slugToSection } from '@/lib/account-nav'

export const metadata: Metadata = {
    title: '用户中心',
    description: '管理账户信息与 TauriApi 配置',
}

export function generateStaticParams() {
    return [
        { slug: ['profile'] },
        { slug: ['environment'] },
        { slug: ['about'] },
        { slug: ['tauri-api', 'apps'] },
        { slug: ['tauri-api', 'cors'] },
        { slug: ['tauri-api', 'event'] },
        { slug: ['phone-api', 'file'] },
        { slug: ['phone-api', 'notification'] },
        { slug: ['phone-api', 'location'] },
        { slug: ['phone-api', 'camera'] },
    ]
}

type AccountPageProps = {
    params: Promise<{ slug?: string[] }>
}

export default async function AccountPage({ params }: AccountPageProps) {
    const { slug } = await params
    const section = slugToSection(slug)
    if (!section) return null
    return <AccountSectionContent section={section} />
}