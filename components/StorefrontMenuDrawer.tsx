'use client'

import { useCallback, useEffect, useState } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { OrderingHoursTable } from '@/components/OrderingHoursTable'
import { ShippingPolicyPanel } from '@/components/ShippingPolicyPanel'
import { getOrderingAvailabilityFromConfig } from '@/lib/orderingHours'
import './storefront-menu-drawer.css'
type DrawerSection = 'ordering-hours' | 'shipping-policy'

export function StorefrontMenuDrawer({
  open,
  onClose,
  config,
  showShippingPolicy = true,
  shippingPolicyLabel = 'Shipping policy',
  orderingHoursNote,
  shippingPolicyContent,
}: {
  open: boolean
  onClose: () => void
  config?: StorefrontConfig | null
  showShippingPolicy?: boolean
  shippingPolicyLabel?: string
  orderingHoursNote?: React.ReactNode
  shippingPolicyContent?: React.ReactNode
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

  return (
    <div
      className={`sf-menu-overlay${open ? ' open' : ''}`}
      aria-hidden={!open}
      onClick={onOverlayClick}
    >
      <aside className="sf-menu-drawer" aria-label="Store menu" onClick={(e) => e.stopPropagation()}>
        <div className="sf-menu-drawer__head">
          <div className="sf-menu-drawer__title">Menu</div>
          <button type="button" className="sf-menu-drawer__close" aria-label="Close menu" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="sf-menu-drawer__subtitle">Quick store details and policies.</p>
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
}: {
  title: string
  subtitle?: string
  onMenuOpen: () => void
  actions?: React.ReactNode
  wide?: boolean
}) {
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
        <a href="#" className="sf-store-header__brand" onClick={(e) => e.preventDefault()}>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </a>
        <div className="sf-store-header__actions">{actions}</div>
      </div>
    </header>
  )
}
