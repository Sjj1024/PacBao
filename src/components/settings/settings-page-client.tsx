'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy /settings/ route — redirect into account profile. */
export function SettingsPageClient() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/account/profile/')
    }, [router])

    return null
}
