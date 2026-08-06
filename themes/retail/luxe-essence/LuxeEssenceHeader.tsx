'use client'

import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ProductCategoryNav } from '@/lib/productCategories'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import { buildLuxeDesktopNav, toLuxeNavCategories } from './luxeEssenceNav'

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
  config: _config,
  siteName,
  tagline,
  logoUrl,
  menuOpen,
  itemCount,
  onMenuOpen,
  onCartOpen,
  categories = [],
}: {
  config: StorefrontConfig | null
  siteName: string
  tagline?: string
  logoUrl?: string | null
  menuOpen: boolean
  itemCount: number
  onMenuOpen: () => void
  onCartOpen: () => void
  categories?: Array<ProductCategoryNav | { slug: string; name: string; sortOrder?: number }>
}) {
  const brand = splitBrandTitle(siteName)
  const trimmedTagline = tagline?.trim()
  const { inline, dropdown } = buildLuxeDesktopNav(toLuxeNavCategories(categories))

  return (
    <header className="le-header">
      <div className="le-header-inner">
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

        <Link href="/" className={`le-logo${logoUrl ? ' le-logo--has-image' : ''}`}>
          {logoUrl ? (
            <div className="le-logo-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" />
            </div>
          ) : null}
          <div className="le-logo-text">
            <span className="le-logo-title">
              {brand.primary}
              {brand.secondary ? (
                <>
                  {' '}
                  <span className="le-logo-title-secondary">| {brand.secondary}</span>
                </>
              ) : null}
            </span>
            {trimmedTagline ? <span className="le-tagline">{trimmedTagline}</span> : null}
          </div>
        </Link>

        <nav className="le-nav-desktop" aria-label="Primary">
          <ul>
            {dropdown.length > 0 ? (
              <li className="le-nav-dropdown">
                <details>
                  <summary>
                    Categories
                    <span className="le-nav-dropdown-caret" aria-hidden />
                  </summary>
                  <ul className="le-nav-dropdown-panel">
                    {dropdown.map((item) => (
                      <li key={`${item.href}-${item.label}`}>
                        <Link
                          href={item.href}
                          className={item.href === '/products' ? 'le-nav-dropdown-viewall' : undefined}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ) : null}
            {inline.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="le-actions">
          <button type="button" className="le-icon-btn le-cart-btn" onClick={onCartOpen} aria-label="Open cart">
            <CartIcon />
            {itemCount > 0 ? <span className="le-cart-count">{itemCount > 99 ? '99+' : itemCount}</span> : null}
          </button>
          <AccountProfileLink className="le-icon-btn" iconClassName="h-5 w-5" />
        </div>
      </div>
    </header>
  )
}
