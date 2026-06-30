'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { AccountNavLink } from '@/components/account/AccountNavLink'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import { StoreStatusBadge } from '@/components/StoreStatusBadge'
import { StorefrontMenuDrawer } from '@/components/StorefrontMenuDrawer'
import './standard-storefront-nav.css'

export interface StandardNavTenant {
  name: string
  logoUrl?: string | null
  brand?: string
}

export function StandardStorefrontNav({
  tenant,
  config,
  itemCount = 0,
  variant = 'retail',
  onCartClick,
  cartHref = '/checkout',
  showShippingPolicy,
  accountMode = 'nav',
  className,
  brandSlot,
  actionsSlot,
}: {
  tenant: StandardNavTenant
  config?: StorefrontConfig | null
  itemCount?: number
  variant?: 'retail' | 'restaurant'
  onCartClick?: () => void
  cartHref?: string
  showShippingPolicy?: boolean
  accountMode?: 'nav' | 'profile'
  className?: string
  brandSlot?: ReactNode
  actionsSlot?: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const shippingVisible = showShippingPolicy ?? variant === 'retail'
  const policyLabel = variant === 'restaurant' ? 'Delivery policy' : 'Shipping policy'

  const cartControl =
    onCartClick != null ? (
      <button type="button" className="sf-standard-nav__cart" onClick={onCartClick}>
        Cart
        {itemCount > 0 ? <span className="sf-standard-nav__cart-badge">{itemCount > 99 ? '99+' : itemCount}</span> : null}
      </button>
    ) : (
      <Link href={cartHref} className="sf-standard-nav__cart">
        Cart
        {itemCount > 0 ? <span className="sf-standard-nav__cart-badge">{itemCount > 99 ? '99+' : itemCount}</span> : null}
      </Link>
    )

  return (
    <>
      <StorefrontMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        config={config}
        showShippingPolicy={shippingVisible}
        shippingPolicyLabel={policyLabel}
      />
      <header className={`sf-standard-nav sf-standard-nav--${variant}${className ? ` ${className}` : ''}`}>
        <nav className="sf-standard-nav__inner">
          <div className="sf-standard-nav__left">
            <button
              type="button"
              className="sf-menu-toggle-btn sf-standard-nav__menu-btn"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            {brandSlot ?? (
              <Link href="/" className="sf-standard-nav__brand" aria-label={`${tenant.name} home`}>
                {tenant.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tenant.logoUrl} alt="" className="sf-standard-nav__logo" />
                ) : (
                  <span
                    className="sf-standard-nav__logo-fallback"
                    style={{ backgroundColor: tenant.brand ?? 'var(--site-brand)' }}
                  >
                    {tenant.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="sf-standard-nav__name">{tenant.name}</span>
              </Link>
            )}
          </div>

          <div className="sf-standard-nav__center">
            <StoreStatusBadge config={config} compact className="sf-standard-nav__status" />
          </div>

          <div className="sf-standard-nav__right">
            {actionsSlot}
            {accountMode === 'profile' ? (
              <AccountProfileLink className="sf-standard-nav__account" />
            ) : (
              <AccountNavLink className="sf-standard-nav__account" />
            )}
            {cartControl}
          </div>
        </nav>
      </header>
    </>
  )
}

/** Compact action cluster for layout themes that keep custom headers. */
export function StandardStorefrontNavActions({
  config,
  itemCount = 0,
  variant = 'retail',
  menuOpen,
  onMenuOpen,
  onMenuClose,
  onCartClick,
  showShippingPolicy,
  accountMode = 'profile',
}: {
  config?: StorefrontConfig | null
  itemCount?: number
  variant?: 'retail' | 'restaurant'
  menuOpen: boolean
  onMenuOpen: () => void
  onMenuClose: () => void
  onCartClick: () => void
  showShippingPolicy?: boolean
  accountMode?: 'nav' | 'profile'
}) {
  const shippingVisible = showShippingPolicy ?? variant === 'retail'
  const policyLabel = variant === 'restaurant' ? 'Delivery policy' : 'Shipping policy'

  return (
    <>
      <StorefrontMenuDrawer
        open={menuOpen}
        onClose={onMenuClose}
        config={config}
        showShippingPolicy={shippingVisible}
        shippingPolicyLabel={policyLabel}
      />
      <div className="sf-standard-nav-actions">
        <StoreStatusBadge config={config} compact className="sf-standard-nav-actions__status" />
        <button
          type="button"
          className="sf-menu-toggle-btn"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={onMenuOpen}
        >
          ☰
        </button>
        {accountMode === 'profile' ? (
          <AccountProfileLink className="sf-standard-nav-actions__account" />
        ) : (
          <AccountNavLink className="sf-standard-nav-actions__account" />
        )}
        <button type="button" className="sf-standard-nav-actions__cart" onClick={onCartClick} aria-label="Open cart">
          🛍
          {itemCount > 0 ? <span className="sf-standard-nav-actions__cart-badge">{itemCount}</span> : null}
        </button>
      </div>
    </>
  )
}
