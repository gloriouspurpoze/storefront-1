'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { PublicProduct } from '@/lib/storefront-api'
import { formatMoney } from '@/lib/format'
import { formatListPrice, productHasVariants } from '@/lib/productVariants'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import { WishlistHeartButton } from '@/components/wishlist/WishlistHeartButton'
import { useCart } from '@/themes/retail/cart'
import { Badge, IconCheck, IconPlus, Price, discountPercent } from '@/ui'
import { openCartDrawer } from './cartDrawerBus'
import './commerce.css'

function secondImage(p: PublicProduct): string | undefined {
  const urls = (p.imageUrls ?? []).filter((u) => u && u !== p.imageUrl)
  return urls[0]
}

/**
 * Dawn-style product card: 4:5 media with hover image swap, sale/sold-out
 * badges, wishlist heart, and a quick-add bar (simple products add straight
 * to the cart and open the drawer; variant products link to the PDP).
 */
export function ProductCard({
  product: p,
  wishlistEnabled,
  priority,
}: {
  product: PublicProduct
  wishlistEnabled?: boolean
  /** Eager-load the image (first row above the fold). */
  priority?: boolean
}) {
  const { addItem, lines } = useCart()
  const { requireAuthForCart } = useCartAuthGate()
  const [added, setAdded] = useState(false)
  const hasVariants = productHasVariants(p)
  const alt = secondImage(p)
  const off = hasVariants ? 0 : discountPercent(p.price, p.originalPrice)
  const href = `/products/${p.slug}`

  function quickAdd() {
    // Mirrors the PDP rule: an item already in the cart is edited there, not re-added.
    if (lines.some((l) => l.productId === p.id && !l.variantId)) {
      if (!openCartDrawer()) window.location.assign('/cart')
      return
    }
    if (!requireAuthForCart()) return
    addItem(p, 1)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
    openCartDrawer()
  }

  return (
    <article className="sf-card sf-wishlist-anchor" data-soldout={!p.inStock || undefined}>
      <div className="sf-card__media">
        <Link href={href} className="sf-card__media-link" tabIndex={-1} aria-hidden>
          {p.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt=""
                className="sf-card__img"
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
              />
              {alt && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={alt} alt="" className="sf-card__img sf-card__img--alt" loading="lazy" decoding="async" />
              )}
            </>
          ) : (
            <span className="sf-card__placeholder">{p.name.charAt(0)}</span>
          )}
        </Link>
        <div className="sf-card__badges">
          {!p.inStock ? (
            <Badge tone="soldout">Sold out</Badge>
          ) : off > 0 ? (
            <Badge tone="sale">-{off}%</Badge>
          ) : null}
        </div>
        {p.inStock && (
          <div className="sf-card__quick">
            {hasVariants ? (
              <Link href={href} className="sf-btn sf-btn--inverse sf-btn--sm sf-btn--block">
                Choose options
              </Link>
            ) : (
              <button type="button" className="sf-btn sf-btn--inverse sf-btn--sm sf-btn--block" onClick={quickAdd}>
                {added ? <IconCheck size={16} /> : <IconPlus size={16} />}
                <span>{added ? 'Added' : 'Quick add'}</span>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="sf-card__info">
        {p.categoryName && <p className="sf-card__vendor">{p.categoryName}</p>}
        <h3 className="sf-card__title">
          <Link href={href}>{p.name}</Link>
        </h3>
        <div className="sf-card__price">
          {hasVariants ? (
            <span className="sf-price">
              <span className="sf-price__now">{formatListPrice(p, (a) => formatMoney(a, p.currency))}</span>
            </span>
          ) : (
            <Price amount={p.price} compareAt={p.originalPrice} currency={p.currency} showOff={false} />
          )}
        </div>
      </div>
      <WishlistHeartButton productId={p.id} productName={p.name} enabled={wishlistEnabled} />
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="sf-card" aria-hidden>
      <span className="sf-skeleton sf-card__media" />
      <div className="sf-card__info">
        <span className="sf-skeleton" style={{ height: 14, width: '70%' }} />
        <span className="sf-skeleton" style={{ height: 14, width: '35%', marginTop: 8 }} />
      </div>
    </div>
  )
}
