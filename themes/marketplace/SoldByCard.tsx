import Link from 'next/link'
import type { PublicSeller } from '@/lib/marketplace-api'
import { Rating } from '@/ui'
import { SellerAvatar, sellerLocation } from './SellerCard'

/** PDP "Sold by" block — who ships it, their rating, and their shipping / return terms. */
export function SoldByCard({ seller }: { seller: PublicSeller }) {
  const where = sellerLocation(seller)
  const shipping = seller.policies?.shippingPolicy?.trim()
  const returns = seller.policies?.returnPolicy?.trim()
  return (
    <aside className="mk-sold-by" aria-label="Seller">
      <div className="mk-sold-by__head">
        <SellerAvatar seller={seller} size={44} />
        <div>
          <p className="mk-sold-by__label">Sold &amp; shipped by</p>
          <Link href={`/store/${seller.slug}`} className="mk-sold-by__name">
            {seller.displayName}
          </Link>
          {seller.reviewCount > 0 ? <Rating value={seller.rating} count={seller.reviewCount} /> : null}
        </div>
      </div>
      {where ? <p className="mk-sold-by__policies">Ships from {where}</p> : null}
      {shipping ? <p className="mk-sold-by__policies">{shipping}</p> : null}
      {returns ? <p className="mk-sold-by__policies">Returns: {returns}</p> : null}
      <Link href={`/store/${seller.slug}`} className="sf-btn sf-btn--secondary sf-btn--sm">
        Visit shop
      </Link>
    </aside>
  )
}
