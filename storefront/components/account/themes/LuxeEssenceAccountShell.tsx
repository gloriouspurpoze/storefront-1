'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAccountAuth } from '../AccountAuthProvider'
import { AccountShellNav } from '../AccountShellNav'
import { displayName } from '@/lib/storefront-auth'
import '@/themes/retail/luxe-essence/luxe-essence.css'

function splitBrandName(siteName: string): [string, string] {
  if (siteName.includes('|')) {
    const parts = siteName.split('|').map((s) => s.trim())
    return [parts[0] ?? siteName, parts[1] ?? 'STUDIO']
  }
  const words = siteName.split(' ')
  return [words[0] ?? siteName, words.slice(1).join(' ') || 'STUDIO']
}

export function LuxeEssenceAccountShell({
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
  const [brandMain, brandSub] = splitBrandName(tenantName)

  return (
    <div className="le-root le-account-page">
      <header className="le-account-header">
        <Link href="/" className="le-account-brand">
          <h1>
            {brandMain} <span>| {brandSub}</span>
          </h1>
          {tagline ? <p className="le-account-tagline">{tagline}</p> : null}
        </Link>

        <AccountShellNav
          className="le-account-nav"
          linkClassName="le-account-nav-link"
          activeClassName="le-account-nav-link le-account-nav-link--active"
        />

        <Link href="/" className="le-account-store-link">
          ← Store
        </Link>
      </header>

      <main className="le-account-main">{children}</main>

      {isAuthenticated && user && !isLogin ? (
        <footer className="le-account-footer">Signed in as {displayName(user)}</footer>
      ) : null}
    </div>
  )
}
