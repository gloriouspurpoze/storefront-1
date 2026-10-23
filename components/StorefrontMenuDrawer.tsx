'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { OrderingHoursTable } from '@/components/OrderingHoursTable'
import { ShippingPolicyPanel } from '@/components/ShippingPolicyPanel'
import { getOrderingAvailabilityFromConfig } from '@/lib/orderingHours'
import './storefront-menu-drawer.css'
type DrawerSection = 'ordering-hours' | 'shipping-policy'

export type StorefrontMenuNavLink = {
  href: string
  label: string
}

export function StorefrontMenuDrawer({
  open,
  onClose,
  config,
  showShippingPolicy = true,
  shippingPolicyLabel = 'Shipping policy',
  showGiftMatch = false,
  navLinks,
  navPresentation = 'pills',
  navExtra,
  orderingHoursNote,
  shippingPolicyContent,
  shippingPolicyHref,
  hoursAlwaysOpen = false,
  drawerId = 'storefront-menu-drawer',
}: {
  open: boolean
  onClose: () => void
  config?: StorefrontConfig | null
  showShippingPolicy?: boolean
  shippingPolicyLabel?: string
  showGiftMatch?: boolean
  /** Links above policy sections. `pills` is the default; `list` is a plain text stack. */
  navLinks?: StorefrontMenuNavLink[]
  navPresentation?: 'pills' | 'list'
  /** Optional block above quick links (e.g. theme category section). */
  navExtra?: React.ReactNode
  orderingHoursNote?: React.ReactNode
  shippingPolicyContent?: React.ReactNode
  /**
   * With `hoursAlwaysOpen`, shipping policy is a plain list link to this page
   * instead of an inline drawer panel. Other themes leave both unset.
   */
  shippingPolicyHref?: string
  /** Keep the hours table visible at the bottom of the drawer. */
  hoursAlwaysOpen?: boolean
  drawerId?: string
}) {
  const [section, setSection] = useState<DrawerSection>('ordering-hours')
  const slotsNote = orderingHoursNote ?? getOrderingAvailabilityFromConfig(config).slotsNote

  useEffect(() => {
    document.body.classList.toggle('sf-menu-open', open)
    return () => document.body.classList.remove('sf-menu-open')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  const pinnedHours = Boolean(hoursAlwaysOpen && shippingPolicyHref)
  const listClass = navPresentation === 'list' ? 'sf-menu-drawer__nav-item' : 'sf-menu-drawer__quick-link'
  const menuLinks = [
    ...(navLinks ?? []),
    ...(pinnedHours && showShippingPolicy
      ? [{ href: shippingPolicyHref as string, label: shippingPolicyLabel }]
      : []),
  ]

  return (
    <div
      className={`sf-menu-overlay${open ? ' open' : ''}`}
      aria-hidden={!open}
      onClick={onOverlayClick}
    >
      <aside
        id={drawerId}
        className="sf-menu-drawer"
        aria-label="Store menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sf-menu-drawer__head">
          <div className="sf-menu-drawer__title">Menu</div>
          <button type="button" className="sf-menu-drawer__close" aria-label="Close menu" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="sf-menu-drawer__subtitle">Quick store details and policies.</p>
        {navExtra}
        {menuLinks.length > 0 ? (
          <nav
            className={navPresentation === 'list' ? 'sf-menu-drawer__nav-list' : 'sf-menu-drawer__quick-links'}
            aria-label="Site navigation"
          >
            {menuLinks.map((link) => {
              const external = /^(https?:|mailto:|tel:)/i.test(link.href)
              if (external) {
                return (
                  <a
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    className={listClass}
                    onClick={onClose}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.label}
                  </a>
                )
              }
              return (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className={listClass}
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        ) : null}
        {showGiftMatch ? (
          <div className="sf-menu-drawer__quick-links">
            <Link href="/gifts" className="sf-menu-drawer__quick-link" onClick={onClose}>
              Gift match
            </Link>
          </div>
        ) : null}
        {pinnedHours ? (
          <div className="sf-menu-drawer__hours">
            <OrderingHoursTable config={config} />
            {slotsNote ? <p className="sf-menu-drawer__note">{slotsNote}</p> : null}
          </div>
        ) : (
          <>
            <div className="sf-menu-drawer__links">
              <button
                type="button"
                className={`sf-menu-drawer__link${section === 'ordering-hours' ? ' active' : ''}`}
                onClick={() => setSection('ordering-hours')}
              >
                <div className="sf-menu-drawer__link-title">Ordering hours</div>
                <div className="sf-menu-drawer__link-copy">
                  See when we accept orders and when delivery slots are available.
                </div>
              </button>
              {showShippingPolicy && (
                <button
                  type="button"
                  className={`sf-menu-drawer__link${section === 'shipping-policy' ? ' active' : ''}`}
                  onClick={() => setSection('shipping-policy')}
                >
                  <div className="sf-menu-drawer__link-title">{shippingPolicyLabel}</div>
                  <div className="sf-menu-drawer__link-copy">
                    Read delivery zones, charges, and expected timelines.
                  </div>
                </button>
              )}
            </div>
            <div className="sf-menu-drawer__info">
              {section === 'ordering-hours' ? (
                <>
                  <OrderingHoursTable config={config} />
                  {slotsNote ? <p className="sf-menu-drawer__note">{slotsNote}</p> : null}
                </>
              ) : shippingPolicyContent ? (
                shippingPolicyContent
              ) : (
                <ShippingPolicyPanel config={config} onClose={onClose} />
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

export function StorefrontHeaderBar({
  title,
  subtitle,
  onMenuOpen,
  actions,
  wide = false,
  homeHref,
  center,
}: {
  title: string
  subtitle?: string
  onMenuOpen: () => void
  actions?: React.ReactNode
  wide?: boolean
  /** When set, the title links home. Otherwise the title is not a navigation link. */
  homeHref?: string
  /** Sits in the bar with the title, not in a row underneath. */
  center?: React.ReactNode
}) {
  const brand = (
    <>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </>
  )
  return (
    <header className="sf-store-header">
      <div className={`sf-store-header__container${wide ? ' wide' : ''}`}>
        <button
          type="button"
          className="sf-menu-toggle-btn"
          aria-label="Open menu"
          onClick={onMenuOpen}
        >
          ☰
        </button>
        {homeHref ? (
          <Link href={homeHref} className="sf-store-header__brand">
            {brand}
          </Link>
        ) : (
          <a href="#" className="sf-store-header__brand" onClick={(e) => e.preventDefault()}>
            {brand}
          </a>
        )}
        {center}
        <div className="sf-store-header__actions">{actions}</div>
      </div>
    </header>
  )
}
