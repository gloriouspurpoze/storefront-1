import Link from 'next/link'
import type { PublicSeller } from '@/lib/marketplace-api'
import { Rating } from '@/ui'
import './marketplace.css'

export function SellerAvatar({ seller, size = 56 }: { seller: Pick<PublicSeller, 'displayName' | 'logoUrl'>; size?: number }) {
  return seller.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={seller.logoUrl} alt="" className="mk-avatar" width={size} height={size} loading="lazy" />
  ) : (
    <span className="mk-avatar mk-avatar--fallback" style={{ width: size, height: size }} aria-hidden>
      {seller.displayName.charAt(0).toUpperCase()}
    </span>
  )
}

export function sellerLocation(seller: Pick<PublicSeller, 'location'>): string {
  return [seller.location?.city, seller.location?.state].filter(Boolean).join(', ')
}

/** Directory / featured-rail card. */
export function SellerCard({ seller }: { seller: PublicSeller }) {
  const where = sellerLocation(seller)
  return (
    <Link href={`/store/${seller.slug}`} className="mk-seller-card">
      <span className="mk-seller-card__banner" aria-hidden>
        {seller.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={seller.bannerUrl} alt="" loading="lazy" />
        ) : null}
      </span>
      <span className="mk-seller-card__body">
        <SellerAvatar seller={seller} size={56} />
        <span className="mk-seller-card__name">{seller.displayName}</span>
        {seller.tagline ? <span className="mk-seller-card__tagline">{seller.tagline}</span> : null}
        <span className="mk-seller-card__meta">
          {seller.reviewCount > 0 ? <Rating value={seller.rating} count={seller.reviewCount} /> : null}
          {where ? <span>{where}</span> : null}
          {typeof seller.listingCount === 'number' ? (
            <span>
              {seller.listingCount} {seller.listingCount === 1 ? 'product' : 'products'}
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  )
}
