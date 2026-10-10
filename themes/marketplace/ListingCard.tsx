'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { MarketplaceListingCard } from '@/lib/marketplace-api'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import { openCartDrawer } from '@/components/commerce/cartDrawerBus'
import { WishlistHeartButton } from '@/components/wishlist/WishlistHeartButton'
import { Badge, IconCheck, IconPlus, Price, Rating, discountPercent } from '@/ui'
import { cartItemFromListing, useCart } from './cart'
import '@/components/commerce/commerce.css'
import './marketplace.css'

/**
 * Listing card: product media, title, price and a "by {seller}" link. Quick add goes
 * straight into the multi-seller cart (listings have a single price — no option picker).
 */
export function ListingCard({ listing, priority }: { listing: MarketplaceListingCard; priority?: boolean }) {
  const { addItem, lines } = useCart()
  const { requireAuthForCart } = useCartAuthGate()
  const [added, setAdded] = useState(false)
  const href = listing.productSlug ? `/products/${listing.productSlug}` : null
  const off = discountPercent(listing.priceInr, listing.compareAtPriceInr)

  function quickAdd() {
    if (lines.some((l) => l.productId === listing.listingId)) {
      if (!openCartDrawer()) window.location.assign('/cart')
      return
    }
    if (!requireAuthForCart()) return
    addItem(cartItemFromListing(listing), 1)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
    openCartDrawer()
  }

  const media = listing.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={listing.imageUrl}
      alt=""
      className="sf-card__img"
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  ) : (
    <span className="sf-card__placeholder">{listing.title.charAt(0)}</span>
  )

  return (
    <article className="sf-card sf-wishlist-anchor mk-listing-card" data-soldout={!listing.inStock || undefined}>
      <div className="sf-card__media">
        {href ? (
          <Link href={href} className="sf-card__media-link" tabIndex={-1} aria-hidden>
            {media}
          </Link>
        ) : (
          <span className="sf-card__media-link">{media}</span>
        )}
        <div className="sf-card__badges">
          {!listing.inStock ? <Badge tone="soldout">Sold out</Badge> : off > 0 ? <Badge tone="sale">-{off}%</Badge> : null}
        </div>
        {listing.inStock && (
          <div className="sf-card__quick">
            {listing.hasVariants && href ? (
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
        {listing.seller.slug ? (
          <Link href={`/store/${listing.seller.slug}`} className="sf-card__vendor mk-listing-card__seller">
            by {listing.seller.name}
          </Link>
        ) : null}
        <h3 className="sf-card__title">{href ? <Link href={href}>{listing.title}</Link> : listing.title}</h3>
        <div className="sf-card__price">
          {listing.hasVariants ? <span className="sf-price__from">From </span> : null}
          <Price amount={listing.priceInr} compareAt={listing.compareAtPriceInr} currency="INR" showOff={false} />
        </div>
        {listing.reviewCount > 0 ? <Rating value={listing.rating} count={listing.reviewCount} /> : null}
      </div>
      {listing.productId ? <WishlistHeartButton productId={listing.productId} productName={listing.title} /> : null}
    </article>
  )
}
