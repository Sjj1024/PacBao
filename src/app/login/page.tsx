'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy /login → account center auth. */
export default function LoginRedirectPage() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/account/profile/')
    }, [router])
    return null
}
