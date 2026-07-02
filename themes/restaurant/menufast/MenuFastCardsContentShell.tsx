import Link from 'next/link'
import type { ReactNode } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '../types'
import { MenuFastCardsFooter } from './MenuFastCardsFooter'
import './menufast.css'

export function MenuFastCardsContentShell({
  tenant,
  config,
  title,
  children,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  title: string
  children: ReactNode
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline
  const logoUrl = config?.branding?.logoUrl || tenant.logoUrl

  return (
    <div className="mf-root theme-menufast-cards">
      <div className="mf-phone-wrap">
        <div className="mf-phone">
          <div className="mf-phone-bar">
            <div className="mf-phone-notch" />
          </div>

          <header className="mf-cards-header mf-cards-content-header">
            <div className="mf-cards-content-header-row">
              <Link href="/" className="mf-cards-content-back">
                ← Menu
              </Link>
              <h1 className="mf-cards-content-page-title">{title}</h1>
            </div>
            <div className={`mf-cards-logo-row${logoUrl ? '' : ' mf-cards-logo-row--no-logo'}`}>
              {logoUrl ? (
                <div className="mf-cards-logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="" />
                </div>
              ) : null}
              <div className="mf-cards-brand-text">
                <span className="mf-cards-biz-name">{siteName}</span>
                {tagline ? <span className="mf-cards-tagline">{tagline}</span> : null}
              </div>
            </div>
          </header>

          <main className="mf-cards-body mf-cards-content-body">
            {children}
            <MenuFastCardsFooter config={config} />
          </main>
        </div>
      </div>
    </div>
  )
}
