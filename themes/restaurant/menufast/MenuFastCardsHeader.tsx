'use client'

import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '../types'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import { MenuFastCardsStoreStatus } from './MenuFastCardsStoreStatus'
import { MenuFastCardsSearchToggle } from './MenuFastCardsSearch'

export function MenuFastCardsToolbar({
  tenant,
  config,
  menuOpen,
  onMenuOpen,
  searchExpanded,
  onSearchExpandedChange,
  searchQuery,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  menuOpen: boolean
  onMenuOpen: () => void
  searchExpanded: boolean
  onSearchExpandedChange: (expanded: boolean) => void
  searchQuery: string
}) {
  const brandColor = config?.branding?.primaryColor || tenant.brand || '#1a1a1a'

  return (
    <div
      className="mf-cards-toolbar"
      style={{ '--mf-brand': brandColor } as React.CSSProperties}
    >
      <MenuFastCardsStoreStatus config={config} />
      <div className="mf-cards-header-actions">
        <MenuFastCardsSearchToggle
          expanded={searchExpanded}
          onExpandedChange={onSearchExpandedChange}
          hasQuery={searchQuery.trim().length > 0}
        />
        <button
          type="button"
          className="mf-menu-btn"
          onClick={onMenuOpen}
          aria-expanded={menuOpen}
          aria-controls="storefront-menu-drawer"
          aria-label="Open site menu"
        >
          <span className="mf-menu-btn-bars" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
        <AccountProfileLink className="mf-account-icon-link" />
      </div>
    </div>
  )
}

export function MenuFastCardsBrand({
  siteName,
  tagline,
  logoUrl,
}: {
  siteName: string
  tagline?: string
  logoUrl?: string | null
}) {
  return (
    <div className={`mf-cards-brand-block${logoUrl ? '' : ' mf-cards-brand-block--no-logo'}`}>
      {logoUrl ? (
        <div className="mf-cards-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" />
        </div>
      ) : null}
      <div className="mf-cards-brand-text">
        <h1 className="mf-cards-biz-name">{siteName}</h1>
        {tagline ? <p className="mf-cards-tagline">{tagline}</p> : null}
      </div>
    </div>
  )
}

/** @deprecated Use MenuFastCardsToolbar + MenuFastCardsBrand */
export function MenuFastCardsHeader({
  tenant,
  config,
  siteName,
  tagline,
  logoUrl,
  menuOpen,
  onMenuOpen,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  siteName: string
  tagline?: string
  logoUrl?: string | null
  menuOpen: boolean
  onMenuOpen: () => void
}) {
  return (
    <header className="mf-cards-header">
      <MenuFastCardsToolbar
        tenant={tenant}
        config={config}
        menuOpen={menuOpen}
        onMenuOpen={onMenuOpen}
        searchExpanded={false}
        onSearchExpandedChange={() => {}}
        searchQuery=""
      />
      <MenuFastCardsBrand siteName={siteName} tagline={tagline} logoUrl={logoUrl} />
    </header>
  )
}
