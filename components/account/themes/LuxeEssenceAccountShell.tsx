'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAccountAuth } from '../AccountAuthProvider'
import { AccountShellNav } from '../AccountShellNav'
import { displayName } from '@/lib/storefront-auth'
import '@/themes/retail/luxe-essence/luxe-essence.css'

function splitBrandTitle(siteName: string): { primary: string; secondary?: string } {
  if (!siteName.includes('|')) return { primary: siteName }
  const [primary, ...rest] = siteName.split('|').map((part) => part.trim())
  const secondary = rest.join(' | ').trim()
  return secondary ? { primary, secondary } : { primary: siteName }
}

export function LuxeEssenceAccountShell({
  tenantName,
  logoUrl,
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
  const isLogin = pathname?.includes('/account/login')
  const isAccountDashboard = Boolean(pathname?.includes('/account') && !isLogin)
  const showHeaderNav = !isAuthenticated || isLogin || !isAccountDashboard
  const brand = splitBrandTitle(tenantName)
  const trimmedTagline = tagline?.trim()

  return (
    <div className="le-root theme-luxe-essence le-account-page">
      <header className="le-account-header">
        <div className="le-account-header-top">
          <Link href="/" className={`le-logo le-account-brand${logoUrl ? ' le-logo--has-image' : ''}`}>
            {logoUrl ? (
              <div className="le-logo-mark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="" />
              </div>
            ) : null}
            <div className="le-logo-text">
              <h1>
                {brand.primary}
                {brand.secondary ? (
                  <>
                    {' '}
                    <span>| {brand.secondary}</span>
                  </>
                ) : null}
              </h1>
              {trimmedTagline ? <p className="le-tagline">{trimmedTagline}</p> : null}
            </div>
          </Link>
          <Link href="/" className="le-account-store-link">
            Back to store
          </Link>
        </div>

        {showHeaderNav ? (
          <AccountShellNav
            className="le-account-nav"
            linkClassName="le-account-nav-link"
            activeClassName="le-account-nav-link le-account-nav-link--active"
          />
        ) : null}
      </header>

      <main className={`le-account-main${isLogin ? ' le-account-main--auth' : ''}`}>{children}</main>

      {isAuthenticated && user && !isLogin ? (
        <footer className="le-account-footer">Signed in as {displayName(user)}</footer>
      ) : null}
    </div>
  )
}
