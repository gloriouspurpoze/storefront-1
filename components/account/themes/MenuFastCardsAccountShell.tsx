'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAccountAuth } from '../AccountAuthProvider'
import { AccountShellNav } from '../AccountShellNav'
import '@/themes/restaurant/menufast/menufast.css'

export function MenuFastCardsAccountShell({
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
  const { isAuthenticated } = useAccountAuth()
  const isLogin = pathname?.includes('/account/login')
  const showHeaderNav = isLogin || !isAuthenticated

  return (
    <div className="theme-menufast-cards mf-root mf-cards-account-page">
      <div className="mf-phone-wrap">
        <div className="mf-phone mf-phone--account">
          <header className="mf-cards-account-header">
            <div className="mf-cards-account-header-top">
              <div className={`mf-cards-logo-row${logoUrl ? '' : ' mf-cards-logo-row--no-logo'}`}>
                <Link href="/" className="mf-cards-account-brand">
                  {logoUrl ? (
                    <div className="mf-cards-logo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt="" />
                    </div>
                  ) : null}
                  <div className="mf-cards-brand-text">
                    <span className="mf-cards-biz-name">{tenantName}</span>
                    {tagline ? <span className="mf-cards-tagline">{tagline}</span> : null}
                  </div>
                </Link>
              </div>
              <div className="mf-cards-account-header-actions">
                {showHeaderNav ? (
                  <AccountShellNav
                    className="mf-cards-account-nav"
                    linkClassName="mf-cards-account-nav-link"
                    activeClassName="mf-cards-account-nav-link mf-cards-account-nav-link--active"
                  />
                ) : (
                  <Link href="/" className="mf-cards-account-menu-link">
                    Menu
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className={`mf-cards-account-main${isLogin ? ' mf-cards-account-main--auth' : ''}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
