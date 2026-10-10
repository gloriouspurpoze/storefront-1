import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ResolvedTenant } from '@/lib/types'
import { fetchStorefrontCategories, fetchStorefrontConfig } from '@/lib/storefront-api'
import { fetchSellers, searchMarketplace } from '@/lib/marketplace-api'
import { SiteChrome } from '@/components/chrome/SiteChrome'
import { PageHeader } from '@/ui'
import { MarketplaceCatalog } from './MarketplaceCatalog'
import { SellerCard } from './SellerCard'
import { toListingQuery, type CatalogQuery } from './catalogQuery'
import './marketplace.css'

/**
 * Every listing-browse surface: `/products` (shop all), `/categories/[slug]` and `/search`.
 * Search also surfaces matching sellers above the product results.
 */
export async function MarketplaceCatalogPage({
  tenant,
  query,
  mode,
  categorySlug,
}: {
  tenant: ResolvedTenant
  query: CatalogQuery
  mode: 'all' | 'category' | 'search'
  categorySlug?: string
}) {
  const effective: CatalogQuery = categorySlug ? { ...query, category: categorySlug } : query
  const [config, categories, page, sellerHits] = await Promise.all([
    fetchStorefrontConfig(tenant.id),
    fetchStorefrontCategories(tenant.id),
    searchMarketplace(tenant.id, toListingQuery(effective)),
    mode === 'search' && query.q ? fetchSellers(tenant.id, { q: query.q, limit: 4 }) : null,
  ])
  const category = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined
  if (mode === 'category' && !category && page.pagination.total === 0) notFound()

  const basePath = mode === 'category' ? `/categories/${categorySlug}` : mode === 'search' ? '/search' : '/products'
  const title =
    mode === 'search'
      ? query.q
        ? `Results for “${query.q}”`
        : 'Search the marketplace'
      : mode === 'category'
        ? (category?.name ?? 'Category')
        : 'Shop all'
  const crumbs = [{ label: 'Home', href: '/' }, ...(mode === 'category' ? [{ label: 'Shop', href: '/products' }] : []), { label: title }]

  return (
    <SiteChrome tenant={tenant} config={config}>
      <main>
        <PageHeader title={title} crumbs={crumbs}>
          {mode === 'all' ? <p className="sf-page-head__sub">Every product from every seller on the marketplace.</p> : null}
        </PageHeader>
        <div className="sf-container">
        {mode === 'search' && !query.q ? (
          <form action="/search" role="search" className="mk-hero__search" style={{ maxWidth: 560, marginBottom: '2rem' }}>
            <input type="search" name="q" placeholder="Search products and sellers…" aria-label="Search" autoFocus />
            <button type="submit" className="sf-btn sf-btn--pill">
              Search
            </button>
          </form>
        ) : null}
        {sellerHits && sellerHits.sellers.length > 0 ? (
          <section aria-label="Matching sellers" style={{ marginBottom: '2rem' }}>
            <h2 className="sf-filters__title">Sellers</h2>
            <ul className="mk-seller-grid">
              {sellerHits.sellers.map((s) => (
                <li key={s.id}>
                  <SellerCard seller={s} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <MarketplaceCatalog
          basePath={basePath}
          query={effective}
          page={page}
          hideCategory={mode === 'category'}
          emptyTitle={mode === 'search' && query.q ? `Nothing found for “${query.q}”.` : 'No products match these filters.'}
          emptyHint={
            <p>
              Try a broader search, or <Link href="/sellers">browse sellers</Link>.
            </p>
          }
        />
        </div>
      </main>
    </SiteChrome>
  )
}
