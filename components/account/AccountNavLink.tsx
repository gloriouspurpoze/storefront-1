'use client'

import Link from 'next/link'
import { useAccountAuth } from './AccountAuthProvider'

/** Minimal account links for theme headers — dashboard or sign in / sign up. */
export function AccountNavLink({ className }: { className?: string }) {
  const { isReady, isAuthenticated } = useAccountAuth()
  const linkClass = className ?? 'hover:opacity-80'

  if (!isReady) {
    return (
      <span className={className ?? 'text-inherit opacity-60'} aria-hidden>
        Account
      </span>
    )
  }

  if (isAuthenticated) {
    return (
      <Link className={linkClass} href="/account">
        Account
      </Link>
    )
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Link className={linkClass} href="/account/login">
        Sign in
      </Link>
      <span className="opacity-40" aria-hidden>
        ·
      </span>
      <Link className={linkClass} href="/account/login?signup=1">
        Sign up
      </Link>
    </span>
  )
}
