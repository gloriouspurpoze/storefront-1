'use client'

import Link from 'next/link'
import { useState, type MouseEvent } from 'react'
import { useWishlist } from './useWishlist'
import './wishlist.css'

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? 'sf-wishlist-icon'}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" />
    </svg>
  )
}

/**
 * Heart toggle for product cards (`variant="overlay"`, absolutely positioned — parent needs
 * `sf-wishlist-anchor`) and the PDP (`variant="inline"`, with a label).
 * Renders nothing unless the Wishlist add-on is active.
 */
export function WishlistHeartButton({
  productId,
  productName,
  enabled,
  variant = 'overlay',
  className,
}: {
  productId: string
  productName?: string
  /** Pass `isAddonActive(config, wishlist)` when known; otherwise the page-level registration decides. */
  enabled?: boolean
  variant?: 'overlay' | 'inline'
  className?: string
}) {
  const wishlist = useWishlist(enabled)
  const [busy, setBusy] = useState(false)
  if (!wishlist.enabled || !productId) return null

  const saved = wishlist.has(productId)
  const label = saved
    ? `Remove${productName ? ` ${productName}` : ''} from wishlist`
    : `Save${productName ? ` ${productName}` : ''} to wishlist`

  const onClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      await wishlist.toggle(productId)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      disabled={busy}
      className={`sf-wishlist-heart sf-wishlist-heart--${variant}${saved ? ' sf-wishlist-heart--saved' : ''}${
        className ? ` ${className}` : ''
      }`}
    >
      <HeartIcon filled={saved} />
      {variant === 'inline' ? <span>{saved ? 'Saved to wishlist' : 'Add to wishlist'}</span> : null}
    </button>
  )
}

/** Header icon with saved-item count. Renders nothing unless the add-on is active. */
export function WishlistNavLink({
  enabled,
  className,
  href = '/wishlist',
}: {
  enabled?: boolean
  className?: string
  href?: string
}) {
  const wishlist = useWishlist(enabled)
  if (!wishlist.enabled) return null
  const count = wishlist.count
  return (
    <Link
      href={href}
      className={`sf-wishlist-nav${className ? ` ${className}` : ''}`}
      aria-label={count ? `Wishlist (${count} saved)` : 'Wishlist'}
    >
      <HeartIcon filled={count > 0} />
      {count > 0 ? <span className="sf-wishlist-nav__badge">{count > 99 ? '99+' : count}</span> : null}
    </Link>
  )
}
