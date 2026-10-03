'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { StorefrontConfig, StorefrontProductCategory } from '@/lib/storefront-api'
import { AccountNavLink } from '@/components/account/AccountNavLink'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import { StoreStatusBadge } from '@/components/StoreStatusBadge'
import { StorefrontMenuDrawer } from '@/components/StorefrontMenuDrawer'
import { WishlistNavLink } from '@/components/wishlist/WishlistHeartButton'
import { useRegisterWishlistAddon } from '@/components/wishlist/useWishlist'
import { SearchOverlay } from '@/components/chrome/SearchOverlay'
import { useScrolled } from '@/components/chrome/useScrolled'
import { IconBag, IconButton, IconChevronDown, IconMenu, IconSearch, cx } from '@/ui'
import './standard-storefront-nav.css'
import './chrome/store-header.css'

export interface StandardNavTenant {
  name: string
  logoUrl?: string | null
  brand?: string
}

function giftMatchEnabled(config?: StorefrontConfig | null, variant?: 'retail' | 'restaurant'): boolean {
  if (variant !== 'retail') return false
  const flags = config?.featureFlags as Record<string, boolean | undefined> | undefined
  return flags?.giftMatch === true
}

/** Desktop "Shop" mega menu: category grid + view-all. Opens on hover or click. */
function ShopMegaMenu({ categories }: { categories: StorefrontProductCategory[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLLIElement | null>(null)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const enter = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const leave = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120)
  }

  const sorted = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return (
    <li ref={ref} className="sf-header__nav-item" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        className="sf-header__nav-link"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        Shop <IconChevronDown size={14} className="sf-header__caret" />
      </button>
      <div className="sf-mega" data-open={open || undefined}>
        <div className="sf-mega__inner sf-container">
          <div className="sf-mega__col">
            <p className="sf-eyebrow">Shop by category</p>
            <ul className="sf-mega__list">
              {sorted.slice(0, 18).map((c) => (
                <li key={c.slug}>
                  <Link href={`/categories/${c.slug}`} onClick={() => setOpen(false)}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="sf-mega__promo">
            <p className="sf-eyebrow">Explore</p>
            <p className="sf-mega__promo-title">Browse the full collection</p>
            <Link href="/products" className="sf-btn sf-btn--sm" onClick={() => setOpen(false)}>
              Shop all
            </Link>
          </div>
        </div>
      </div>
    </li>
  )
}

export function StandardStorefrontNav({
  tenant,
  config,
  itemCount = 0,
  variant = 'retail',
  onCartClick,
  cartHref = '/cart',
  showShippingPolicy,
  accountMode = 'nav',
  className,
  brandSlot,
  actionsSlot,
  navLinks,
  categories,
  announcement,
}: {
  tenant: StandardNavTenant
  config?: StorefrontConfig | null
  itemCount?: number
  variant?: 'retail' | 'restaurant'
  onCartClick?: () => void
  cartHref?: string
  showShippingPolicy?: boolean
  /** Kept for API compatibility; the header always shows the account icon. */
  accountMode?: 'nav' | 'profile'
  className?: string
  brandSlot?: ReactNode
  actionsSlot?: ReactNode
  /** CMS header menu (or vertical defaults): inline on desktop, in the drawer on mobile. */
  navLinks?: { href: string; label: string }[]
  /** Product categories → desktop "Shop" mega menu, search suggestions and drawer. */
  categories?: StorefrontProductCategory[]
  /** Optional strip rendered above the bar (announcement / offers). */
  announcement?: ReactNode
}) {
  void accountMode
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const scrolled = useScrolled()
  const shippingVisible = showShippingPolicy ?? variant === 'retail'
  const policyLabel = variant === 'restaurant' ? 'Delivery policy' : 'Shipping policy'
  const showGiftMatch = giftMatchEnabled(config, variant)
  const wishlistOn = useRegisterWishlistAddon(config) && variant === 'retail'
  const hasCategories = variant === 'retail' && (categories?.length ?? 0) > 0

  const allLinks = (navLinks ?? []).filter((l) => l.href && l.label)
  // The Shop mega menu already links to /products; don't repeat it inline.
  const links = allLinks.filter((l) => !(hasCategories && l.href === '/products')).slice(0, 6)
  const categoryLinks = (categories ?? []).map((c) => ({ href: `/categories/${c.slug}`, label: c.name }))
  const drawerLinks = [...allLinks.slice(0, 6), ...categoryLinks.filter((c) => !links.some((l) => l.href === c.href))]

  const cartLabel = itemCount > 0 ? `Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}` : 'Cart'
  const cartControl =
    onCartClick != null ? (
      <IconButton label={cartLabel} count={itemCount} onClick={onCartClick} className="sf-header__cart">
        <IconBag />
      </IconButton>
    ) : (
      <Link href={cartHref} className="sf-icon-btn sf-header__cart" aria-label={cartLabel} title="Cart">
        <IconBag />
        {itemCount > 0 ? (
          <span key={itemCount} className="sf-icon-btn__count" aria-hidden>
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        ) : null}
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
        showGiftMatch={showGiftMatch}
        navLinks={drawerLinks.length ? drawerLinks : navLinks}
        navExtra={
          <div className="sf-header__drawer-account">
            <AccountNavLink />
          </div>
        }
      />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        suggestions={categoryLinks.length ? categoryLinks : links}
        placeholder={variant === 'restaurant' ? 'Search the menu…' : undefined}
      />
      <header
        className={cx('sf-header', `sf-header--${variant}`, 'sf-standard-nav', className)}
        data-scrolled={scrolled || undefined}
      >
        {announcement}
        <nav className="sf-header__bar sf-container" aria-label="Main">
          <div className="sf-header__start">
            <IconButton
              label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="storefront-menu-drawer"
              className="sf-header__menu-btn"
              onClick={() => setMenuOpen(true)}
            >
              <IconMenu />
            </IconButton>
            {brandSlot ?? (
              <Link href="/" className="sf-header__brand" aria-label={`${tenant.name} home`}>
                {tenant.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tenant.logoUrl} alt="" className="sf-header__logo" />
                ) : (
                  <span
                    className="sf-header__logo-fallback"
                    style={{ backgroundColor: tenant.brand ?? 'var(--site-brand)' }}
                  >
                    {tenant.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="sf-header__name">{tenant.name}</span>
              </Link>
            )}
          </div>

          <ul className="sf-header__nav">
            {hasCategories ? <ShopMegaMenu categories={categories!} /> : null}
            {links.map((l) => (
              <li key={l.href} className="sf-header__nav-item">
                <Link href={l.href} className="sf-header__nav-link">
                  {l.label}
                </Link>
              </li>
            ))}
            {showGiftMatch ? (
              <li className="sf-header__nav-item">
                <Link href="/gifts" className="sf-header__nav-link">
                  Gifts
                </Link>
              </li>
            ) : null}
          </ul>

          <div className="sf-header__end">
            {variant === 'restaurant' ? (
              <StoreStatusBadge config={config} compact className="sf-header__status" />
            ) : null}
            {actionsSlot}
            <IconButton label="Search" onClick={() => setSearchOpen(true)} className="sf-header__search">
              <IconSearch />
            </IconButton>
            {wishlistOn ? <WishlistNavLink enabled className="sf-icon-btn sf-header__wishlist" /> : null}
            <AccountProfileLink className="sf-icon-btn sf-header__account" iconClassName="sf-icon" />
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
  navLinks,
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
  navLinks?: { href: string; label: string }[]
}) {
  const shippingVisible = showShippingPolicy ?? variant === 'retail'
  const policyLabel = variant === 'restaurant' ? 'Delivery policy' : 'Shipping policy'
  const showGiftMatch = giftMatchEnabled(config, variant)
  const wishlistOn = useRegisterWishlistAddon(config) && variant === 'retail'

  return (
    <>
      <StorefrontMenuDrawer
        open={menuOpen}
        onClose={onMenuClose}
        config={config}
        showShippingPolicy={shippingVisible}
        shippingPolicyLabel={policyLabel}
        showGiftMatch={showGiftMatch}
        navLinks={navLinks}
      />
      <div className="sf-standard-nav-actions">
        {variant === 'restaurant' ? (
          <StoreStatusBadge config={config} compact className="sf-standard-nav-actions__status" />
        ) : null}
        <button
          type="button"
          className="sf-menu-toggle-btn"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={onMenuOpen}
        >
          <IconMenu />
        </button>
        {accountMode === 'profile' ? (
          <AccountProfileLink className="sf-standard-nav-actions__account" />
        ) : (
          <AccountNavLink className="sf-standard-nav-actions__account" />
        )}
        {wishlistOn ? <WishlistNavLink enabled className="sf-standard-nav-actions__wishlist" /> : null}
        <button type="button" className="sf-standard-nav-actions__cart" onClick={onCartClick} aria-label="Open cart">
          <IconBag />
          {itemCount > 0 ? <span className="sf-standard-nav-actions__cart-badge">{itemCount}</span> : null}
        </button>
      </div>
    </>
  )
}
