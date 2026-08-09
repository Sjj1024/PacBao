'use client'

import { AccountSectionPanel } from '@/components/account/account-section-panel'
import { useAuthUser } from '@/hooks/use-auth-user'
import type { AccountSectionId } from '@/lib/account-nav'

type AccountSectionContentProps = {
    section: AccountSectionId
}

export function AccountSectionContent({ section }: AccountSectionContentProps) {
    const { user, ready } = useAuthUser()
    return (
        <AccountSectionPanel
            section={section}
            authUser={user}
            authReady={ready}
        />
    )
}
