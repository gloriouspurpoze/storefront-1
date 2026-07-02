'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAccountAuth } from '../AccountAuthProvider'
import { AccountShellNav } from '../AccountShellNav'
import { displayName } from '@/lib/storefront-auth'
import '@/themes/retail/soft-studio/soft-studio.css'

export function SoftStudioAccountShell({
  tenantName,
  tagline,
  children,
}: {
  tenantName: string
  logoUrl?: string
  tagline?: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAccountAuth()
  const isLogin = pathname?.endsWith('/login')

  return (
    <div className="ss-root ss-account-page">
      <nav className="ss-account-nav">
        <Link href="/" className="ss-account-brand">
          <span className="ss-account-logo">{tenantName}</span>
          {tagline ? <span className="ss-account-tagline">{tagline}</span> : null}
        </Link>

        <AccountShellNav
          className="ss-account-nav-links"
          linkClassName="ss-account-nav-link"
          activeClassName="ss-account-nav-link ss-account-nav-link--active"
        />

        <Link href="/" className="ss-account-store-btn">
          <span aria-hidden>←</span> Back to store
        </Link>
      </nav>

      <main className={`ss-account-main${isLogin ? ' ss-account-main--auth' : ''}`}>{children}</main>

      {isAuthenticated && user && !isLogin ? (
        <footer className="ss-account-footer">Signed in as {displayName(user)}</footer>
      ) : null}
    </div>
  )
}
