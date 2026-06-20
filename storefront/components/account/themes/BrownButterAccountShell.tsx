'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAccountAuth } from '../AccountAuthProvider'
import { AccountShellNav } from '../AccountShellNav'
import { displayName } from '@/lib/storefront-auth'
import '@/themes/private/thebrownbutter/brown-butter.css'

export function BrownButterAccountShell({
  tenantName,
  logoUrl,
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
    <div className="bb-root bb-page bb-account-page">
      <div className="bb-account-wrap">
        <header className="bb-account-header">
          <Link href="/" className="bb-account-brand">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="bb-account-logo" />
            ) : (
              <span className="bb-account-logo-fallback">{tenantName.charAt(0)}</span>
            )}
            <span className="bb-account-name">{tenantName}</span>
          </Link>
          <AccountShellNav
            className="bb-account-nav"
            linkClassName="bb-account-nav-link"
            activeClassName="bb-account-nav-link bb-account-nav-link--active"
          />
        </header>

        <main className="bb-account-main">{children}</main>

        {isAuthenticated && user && !isLogin ? (
          <footer className="bb-account-footer">Signed in as {displayName(user)}</footer>
        ) : null}
      </div>
    </div>
  )
}
