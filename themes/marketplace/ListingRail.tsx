import Link from 'next/link'
import type { MarketplaceListingCard } from '@/lib/marketplace-api'
import { cx } from '@/ui'
import { ListingCard } from './ListingCard'

/** Titled row of listing cards with a "view all" link (home rails, "more from this seller"). */
export function ListingRail({
  eyebrow,
  title,
  listings,
  viewAllHref,
  viewAllLabel = 'View all',
  columns = 4,
}: {
  eyebrow?: string
  title: string
  listings: MarketplaceListingCard[]
  viewAllHref?: string
  viewAllLabel?: string
  columns?: 3 | 4
}) {
  if (!listings.length) return null
  return (
    <section className="sf-section sf-container">
      <div className="sf-section-head">
        <div>
          {eyebrow ? <p className="sf-eyebrow">{eyebrow}</p> : null}
          <h2 className="sf-heading">{title}</h2>
        </div>
        {viewAllHref ? (
          <Link href={viewAllHref} className="sf-btn sf-btn--link">
            {viewAllLabel}
          </Link>
        ) : null}
      </div>
      <ul className={cx('sf-product-grid', columns === 3 && 'sf-product-grid--3')}>
        {listings.map((l) => (
          <li key={l.listingId}>
            <ListingCard listing={l} />
          </li>
        ))}
      </ul>
    </section>
  )
}
