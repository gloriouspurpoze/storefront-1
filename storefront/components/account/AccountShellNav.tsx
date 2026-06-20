'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccountAuth } from './AccountAuthProvider'

export function AccountShellNav({
  className,
  linkClassName,
  activeClassName,
  onSignOut,
}: {
  className?: string
  linkClassName?: string
  activeClassName?: string
  onSignOut?: () => void
}) {
  const pathname = usePathname()
  const { isAuthenticated, logout } = useAccountAuth()
  const isLogin = pathname?.endsWith('/login')
  const link = linkClassName ?? ''
  const active = activeClassName ?? link

  const isActive = (path: string) =>
    pathname === path || pathname?.endsWith(`${path}/`) || pathname?.includes(path)

  const handleSignOut = () => {
    if (onSignOut) onSignOut()
    else void logout()
  }

  if (isLogin) return null

  return (
    <nav className={className} aria-label="Account">
      {isAuthenticated ? (
        <>
          <Link href="/account" className={isActive('/account') && !pathname?.includes('/login') ? active : link}>
            Orders
          </Link>
          <Link href="/orders/track" className={isActive('/orders/track') ? active : link}>
            Track
          </Link>
          <button type="button" onClick={handleSignOut} className={link}>
            Sign out
          </button>
        </>
      ) : (
        <>
          <Link href="/orders/track" className={link}>
            Track order
          </Link>
          <Link href="/account/login" className={link}>
            Sign in
          </Link>
          <Link href="/account/login?signup=1" className={active}>
            Sign up
          </Link>
        </>
      )}
    </nav>
  )
}
