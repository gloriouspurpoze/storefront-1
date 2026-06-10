import Link from 'next/link'
import type { ThemeTenant } from '../types'

interface SaffronHeaderProps {
  tenant: ThemeTenant
  cartCount: number
  isOpen?: boolean
  onCartClick?: () => void
}

/**
 * Sticky header for the Saffron theme.
 * Used as a Server Component when `onCartClick` is not needed,
 * or as a client-rendered component inside SaffronMenuPage (cart count updates).
 */
export function SaffronHeader({
  tenant,
  cartCount,
  isOpen = true,
  onCartClick,
}: SaffronHeaderProps) {
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
        <span>{tenant.name}</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
          {isOpen ? 'Open · Closes 11 PM' : 'Closed'}
        </div>

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
