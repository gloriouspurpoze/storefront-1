'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { useAccountAuth } from '../AccountAuthProvider'
import { AccountShellNav } from '../AccountShellNav'
import { displayName } from '@/lib/storefront-auth'
import '@/themes/restaurant/saffron/saffron-account.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500'],
})

export function SaffronAccountShell({
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
    <div className={`theme-saffron saf-account-page ${playfair.variable} ${dmSans.variable}`}>
      <header className="saf-account-header">
        <Link href="/" className="saf-account-brand">
          {tenantName}
        </Link>

        <AccountShellNav
          className="saf-account-nav"
          linkClassName="saf-account-nav-link"
          activeClassName="saf-account-nav-link saf-account-nav-link--active"
        />

        <Link href="/" className="saf-account-store-link">
          Menu
        </Link>
      </header>

      <main className="saf-account-main">{children}</main>

      {isAuthenticated && user && !isLogin ? (
        <footer className="saf-account-footer">Signed in as {displayName(user)}</footer>
      ) : null}
    </div>
  )
}
