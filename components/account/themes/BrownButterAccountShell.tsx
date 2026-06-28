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
  const userInitial = (
    user?.firstName?.charAt(0) ||
    user?.email?.charAt(0) ||
    '?'
  ).toUpperCase()

  return (
    <div className="bb-root bb-page bb-account-page">
      <div className="bb-account-wrap">
        <header className="bb-account-topbar">
          <Link href="/" className="bb-account-back">
            ← Menu
          </Link>
          <span className="bb-account-topbar-title">{isLogin ? 'Sign in' : 'Your account'}</span>
          <span className="bb-account-topbar-spacer" aria-hidden />
        </header>

        <section className="bb-account-hero">
          <div className="hero-img-ring">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="hero-logo-img" />
            ) : (
              <span
                className="hero-logo-img"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 900,
                  fontSize: 28,
                  color: 'var(--sky-dark)',
                }}
              >
                {tenantName.charAt(0)}
              </span>
            )}
          </div>
          <h1 className="hero-title">{tenantName}</h1>
          <p className="hero-sub">
            {isLogin ? (
              <>Sign in to track orders &amp; reorder favourites</>
            ) : (
              <>
                Order history · <strong>{tagline || 'Fresh baked daily'}</strong>
              </>
            )}
          </p>
        </section>

        {!isLogin ? (
          <div className="bb-account-nav-wrap">
            <AccountShellNav
              className="bb-account-nav"
              linkClassName="bb-account-nav-link"
              activeClassName="bb-account-nav-link bb-account-nav-link--active"
            />
          </div>
        ) : null}

        {isAuthenticated && user && !isLogin ? (
          <div className="bb-account-user-card">
            <div className="bb-account-user-avatar" aria-hidden>
              {userInitial}
            </div>
            <div className="bb-account-user-info">
              <p className="bb-account-user-name">{displayName(user)}</p>
              <p className="bb-account-user-meta">
                {user.phone
                  ? `+91 ${user.phone}`
                  : user.email &&
                      !user.email.includes('@phone.profixer.local') &&
                      !user.email.includes('@temp.com')
                    ? user.email
                    : 'Signed in'}
              </p>
            </div>
          </div>
        ) : null}

        <main className="bb-account-main">{children}</main>
      </div>
    </div>
  )
}
