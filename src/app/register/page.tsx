'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy /register → account center auth. */
export default function RegisterRedirectPage() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/account/profile/')
    }, [router])
    return null
}
