import { AccountLayoutClient } from '@/components/account/account-layout-client'

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <AccountLayoutClient>{children}</AccountLayoutClient>
}
