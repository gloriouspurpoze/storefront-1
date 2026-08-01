'use client'

import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'

const DESKTOP_NAV = [
  { href: '#products', label: 'Shop' },
  { href: '/products', label: 'All products' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
] as const

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
            {DESKTOP_NAV.map((item) => (
              <li key={item.href}>
                {item.href.startsWith('#') ? (
                  <a href={item.href}>{item.label}</a>
                ) : (
                  <Link href={item.href}>{item.label}</Link>
                )}
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
