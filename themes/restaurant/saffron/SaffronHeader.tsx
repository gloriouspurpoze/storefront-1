'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import {
  getOrderingAvailabilityFromConfig,
  getOrderingHoursFromConfig,
  getTodayOrderingLabel,
  isStoreOpenNow,
} from '@/lib/orderingHours'
import { AccountNavLink } from '@/components/account/AccountNavLink'
import type { ThemeTenant } from '../types'

interface SaffronHeaderProps {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  cartCount: number
  isOpen?: boolean
  onCartClick?: () => void
  onMenuOpen?: () => void
}

/**
 * Sticky header for the Saffron theme.
 * Used as a Server Component when `onCartClick` is not needed,
 * or as a client-rendered component inside SaffronMenuPage (cart count updates).
 */
export function SaffronHeader({
  tenant,
  config,
  cartCount,
  isOpen: isOpenProp,
  onCartClick,
  onMenuOpen,
}: SaffronHeaderProps) {
  const hours = useMemo(() => getOrderingHoursFromConfig(config), [config])
  const availability = useMemo(() => getOrderingAvailabilityFromConfig(config), [config])
  const isOpen = isOpenProp ?? isStoreOpenNow(hours)
  const hoursLabel = getTodayOrderingLabel(hours)
  const statusText = availability.slotsNote
    ? availability.slotsNote
    : isOpen
      ? `Open · ${hoursLabel}`
      : `Closed · ${hoursLabel}`

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--cream, #FAF8F3)',
        borderBottom: '1px solid var(--saf-border, rgba(26,23,20,0.1))',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {onMenuOpen ? (
          <button
            type="button"
            className="sf-menu-toggle-btn"
            aria-label="Open menu"
            onClick={onMenuOpen}
          >
            ☰
          </button>
        ) : null}
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
            fontSize: '22px',
            fontWeight: 500,
            letterSpacing: '-0.3px',
            color: 'var(--ink, #1A1714)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: 0,
          }}
          aria-label={`${tenant.name} home`}
        >
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt=""
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            />
          ) : null}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tenant.name}
          </span>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
        <div
          style={{
            fontSize: '13px',
            color: 'var(--ink-muted, #8A847C)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isOpen ? '#4CAF50' : '#9E9E9E',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          {statusText}
        </div>

        <AccountNavLink
          className="text-[13px] text-[var(--ink-muted,#8A847C)] hover:text-[var(--ink,#1A1714)]"
        />

        <button
          onClick={onCartClick}
          aria-label={`Your cart, ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--ink, #1A1714)',
            color: 'var(--cream, #FAF8F3)',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '100px',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          Your Cart
          <span
            style={{
              background: 'var(--terracotta, #C4633A)',
              color: 'white',
              borderRadius: '50%',
              width: 20,
              height: 20,
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              minWidth: 20,
            }}
          >
            {cartCount}
          </span>
        </button>
      </div>
    </header>
  )
}
