'use client'

import type { StorefrontConfig } from '@/lib/storefront-api'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import { LuxeEssenceHeaderStoreStatus } from './LuxeEssenceStoreStatus'

function splitBrandTitle(siteName: string): { primary: string; secondary?: string } {
  if (!siteName.includes('|')) return { primary: siteName }
  const [primary, ...rest] = siteName.split('|').map((part) => part.trim())
  const secondary = rest.join(' | ').trim()
  return secondary ? { primary, secondary } : { primary: siteName }
}

function MenuIcon() {
  return (
    <span className="le-menu-icon" aria-hidden>
      <span />
      <span />
      <span />
    </span>
  )
}

function CartIcon() {
  return (
    <svg className="le-cart-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

export function LuxeEssenceHeader({
  config,
  siteName,
  tagline,
  logoUrl,
  menuOpen,
  itemCount,
  onMenuOpen,
  onCartOpen,
}: {
  config: StorefrontConfig | null
  siteName: string
  tagline?: string
  logoUrl?: string | null
  menuOpen: boolean
  itemCount: number
  onMenuOpen: () => void
  onCartOpen: () => void
}) {
  const brand = splitBrandTitle(siteName)
  const trimmedTagline = tagline?.trim()

  return (
    <header className="le-header">
      <div className={`le-logo${logoUrl ? ' le-logo--has-image' : ''}`}>
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
      </div>

      <LuxeEssenceHeaderStoreStatus config={config} />

      <div className="le-actions">
        <button
          type="button"
          className="le-menu-toggle"
          onClick={onMenuOpen}
          aria-expanded={menuOpen}
          aria-controls="storefront-menu-drawer"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
        <AccountProfileLink className="le-icon-btn" iconClassName="h-5 w-5" />
        <button type="button" className="le-icon-btn" onClick={onCartOpen} aria-label="Open cart">
          <CartIcon />
          {itemCount > 0 ? <span className="le-cart-count">{itemCount}</span> : null}
        </button>
      </div>
    </header>
  )
}
