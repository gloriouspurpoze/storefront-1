'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAccountAuth } from '../AccountAuthProvider'
import { AccountShellNav } from '../AccountShellNav'
import { displayName } from '@/lib/storefront-auth'
import '@/themes/restaurant/menufast/menufast.css'

export function MenuFastAccountShell({
  tenantName,
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
    <div className="theme-menufast-minimal mf-account-page">
      <header className="mf-account-header">
        <Link href="/" className="mf-account-brand">
          {tenantName}
        </Link>

        <AccountShellNav
          className="mf-account-nav"
          linkClassName="mf-account-nav-link"
          activeClassName="mf-account-nav-link mf-account-nav-link--active"
        />

        <Link href="/" className="mf-account-store-link">
          Menu
        </Link>
      </header>

      <main className="mf-account-main">{children}</main>

      {isAuthenticated && user && !isLogin ? (
        <footer className="mf-account-footer">Signed in as {displayName(user)}</footer>
      ) : null}
    </div>
  )
}
