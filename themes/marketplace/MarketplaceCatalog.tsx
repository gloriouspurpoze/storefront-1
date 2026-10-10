'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { formatMoney } from '@/lib/format'
import { MARKETPLACE_SORTS, type MarketplaceListingPage } from '@/lib/marketplace-api'
import { Button, Drawer, IconFilter, Select, cx } from '@/ui'
import { catalogHref, priceBands, type CatalogQuery } from './catalogQuery'
import { ListingCard } from './ListingCard'
import '@/components/commerce/commerce.css'
import './marketplace.css'

/**
 * Faceted listing browser for every marketplace catalog surface (shop all, category, search,
 * seller store). Server-rendered results; every filter, sort and page is a URL so results are
 * shareable, crawlable and back-button safe. Facet counts come from the API.
 */
export function MarketplaceCatalog({
  basePath,
  query,
  page,
  hideCategory,
  hideSellers,
  emptyTitle = 'No products match these filters.',
  emptyHint,
}: {
  basePath: string
  query: CatalogQuery
  page: MarketplaceListingPage
  /** Category is fixed by the route (`/categories/[slug]`). */
  hideCategory?: boolean
  /** Seller is fixed by the route (`/store/[slug]`). */
  hideSellers?: boolean
  emptyTitle?: string
  emptyHint?: React.ReactNode
}) {
  const router = useRouter()
  const [drawer, setDrawer] = useState(false)
  const searchParams = useSearchParams()
  // A facet link navigates in place — close the mobile drawer once the new results land.
  useEffect(() => setDrawer(false), [searchParams])
  const facets = page.facets
  const bands = facets ? priceBands(facets.priceRange) : []
  const activeBand = bands.findIndex((b) => b.min === query.minPrice && b.max === query.maxPrice)
  const activeCount = Number(Boolean(!hideCategory && query.category)) + Number(Boolean(query.minPrice || query.maxPrice))
  const { total, totalPages } = page.pagination
  const current = Math.max(query.page ?? 1, 1)

  const filters = (
    <div className="sf-filters">
      {!hideCategory && facets && facets.categories.length > 0 && (
        <div className="sf-filters__group">
          <p className="sf-filters__title">Category</p>
          <ul className="sf-filters__links">
            <li>
              <Link href={catalogHref(basePath, query, { category: undefined })} aria-current={!query.category ? 'page' : undefined}>
                All categories
              </Link>
            </li>
            {facets.categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={catalogHref(basePath, query, { category: c.slug })}
                  aria-current={query.category === c.slug ? 'page' : undefined}
                  className="mk-facet-link"
                >
                  <span>{c.name}</span>
                  <span className="mk-facet-link__count">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {bands.length > 0 && (
        <div className="sf-filters__group">
          <p className="sf-filters__title">Price</p>
          <div className="sf-filters__chips">
            {bands.map((b, i) => {
              const on = activeBand === i
              const label =
                b.min == null
                  ? `Under ${formatMoney(b.max!, 'INR')}`
                  : b.max == null
                    ? `${formatMoney(b.min, 'INR')}+`
                    : `${formatMoney(b.min, 'INR')} – ${formatMoney(b.max, 'INR')}`
              return (
                <Link
                  key={i}
                  className="sf-tab"
                  aria-current={on ? 'true' : undefined}
                  href={catalogHref(basePath, query, on ? { minPrice: undefined, maxPrice: undefined } : { minPrice: b.min, maxPrice: b.max })}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
      {!hideSellers && facets && facets.sellers.length > 1 && (
        <div className="sf-filters__group">
          <p className="sf-filters__title">Sellers</p>
          <ul className="sf-filters__links">
            {facets.sellers.slice(0, 12).map((s) => (
              <li key={s.id}>
                <Link href={`/store/${s.slug}`} className="mk-facet-link">
                  <span>{s.name}</span>
                  <span className="mk-facet-link__count">{s.count}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/sellers" className="mk-facet-more">
            Browse all sellers
          </Link>
        </div>
      )}
      {activeCount > 0 && (
        <Link
          href={catalogHref(basePath, query, { category: hideCategory ? query.category : undefined, minPrice: undefined, maxPrice: undefined })}
          className="sf-btn sf-btn--link"
        >
          Clear filters
        </Link>
      )}
    </div>
  )

  return (
    <div className="sf-catalog">
      <aside className="sf-catalog__aside" aria-label="Filters">
        {filters}
      </aside>
      <div className="sf-catalog__main">
        <div className="sf-catalog__toolbar">
          <Button
            variant="secondary"
            size="sm"
            className="sf-catalog__filter-btn"
            iconLeft={<IconFilter size={16} />}
            onClick={() => setDrawer(true)}
          >
            Filter{activeCount ? ` (${activeCount})` : ''}
          </Button>
          <p className="sf-catalog__count" aria-live="polite">
            {total.toLocaleString('en-IN')} {total === 1 ? 'product' : 'products'}
          </p>
          <label className="sf-catalog__sort">
            <span className="sf-visually-hidden">Sort by</span>
            <Select
              value={query.sort ?? 'relevance'}
              onChange={(e) => router.push(catalogHref(basePath, query, { sort: e.target.value as CatalogQuery['sort'] }))}
            >
              {MARKETPLACE_SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {page.listings.length ? (
          <ul className={cx('sf-product-grid', 'sf-product-grid--3')}>
            {page.listings.map((l, i) => (
              <li key={l.listingId}>
                <ListingCard listing={l} priority={i < 3} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="sf-product-empty">
            <p>{emptyTitle}</p>
            {emptyHint}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mk-pagination" aria-label="Pagination">
            {current > 1 ? (
              <Link href={catalogHref(basePath, query, { page: current - 1 })} className="sf-btn sf-btn--secondary sf-btn--sm" rel="prev">
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="mk-pagination__status">
              Page {current} of {totalPages}
            </span>
            {current < totalPages ? (
              <Link href={catalogHref(basePath, query, { page: current + 1 })} className="sf-btn sf-btn--secondary sf-btn--sm" rel="next">
                Next
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        side="left"
        title="Filters"
        footer={
          <Button block onClick={() => setDrawer(false)}>
            Show {total.toLocaleString('en-IN')} results
          </Button>
        }
      >
        {filters}
      </Drawer>
    </div>
  )
}
