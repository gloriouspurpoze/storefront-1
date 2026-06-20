'use client'

import Link from 'next/link'
import { useAccountAuth } from './AccountAuthProvider'

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'h-5 w-5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

/** Profile icon linking to the account dashboard (or sign-up when logged out). */
export function AccountProfileLink({
  className,
  iconClassName,
}: {
  className?: string
  iconClassName?: string
}) {
  const { isReady, isAuthenticated } = useAccountAuth()
  const href = isAuthenticated ? '/account' : '/account/login?signup=1'
  const label = isAuthenticated ? 'Your account' : 'Sign up for your account'

  if (!isReady) {
    return (
      <span className={className ?? 'inline-flex opacity-60'} aria-hidden>
        <ProfileIcon className={iconClassName} />
      </span>
    )
  }

  return (
    <Link
      href={href}
      className={className ?? 'inline-flex items-center justify-center hover:opacity-80'}
      aria-label={label}
      title={label}
    >
      <ProfileIcon className={iconClassName} />
    </Link>
  )
}
