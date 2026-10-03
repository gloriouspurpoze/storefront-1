import Link from 'next/link'
import type { ReactNode } from 'react'
import { searchMarketplace } from '@/lib/runMarketplaceCheckout'
import { loadThemeTenant } from '@/lib/load-tenant'
import {
  fetchMenu,
  fetchProducts,
  fetchServices,
  fetchStorefrontConfig,
  type PublicMenuCategory,
  type PublicProduct,
  type PublicService,
} from '@/lib/storefront-api'
import { SiteChrome } from '@/components/chrome/SiteChrome'
import { PageHeader, IconSearch } from '@/ui'
import { ProductGrid } from '@/themes/retail/ProductGrid'
import { MenuSectionInteractive } from '@/themes/restaurant/MenuSectionInteractive'
import { ServiceGrid } from '@/themes/home-services/ServiceGrid'

export const dynamic = 'force-dynamic'

type Listing = {
  _id?: string
  title?: string
  slug?: string
  listingType?: string
  priceInr?: number
  sellerId?: { displayName?: string; slug?: string }
}

/** Case-insensitive match on every whitespace-separated term. */
function matches(q: string, ...fields: Array<string | undefined>): boolean {
  const hay = fields.filter(Boolean).join(' ').toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term))
}

function SearchForm({ q, placeholder }: { q: string; placeholder: string }) {
  return (
    <form className="sf-search-page__form" method="get" role="search">
      <IconSearch />
      <input name="q" defaultValue={q} placeholder={placeholder} aria-label="Search" className="sf-search-page__input" />
      <button type="submit" className="sf-btn">
        Search
      </button>
    </form>
  )
}

function ResultCount({ q, count, noun }: { q: string; count: number; noun: string }) {
  if (!q) return null
  return (
    <p className="sf-subtle" style={{ margin: '1.25rem 0 1.5rem' }}>
      {count} {noun}
      {count === 1 ? '' : 's'} for “{q}”
    </p>
  )
}

export default async function StorefrontSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>
  searchParams: Promise<{ q?: string; types?: string }>
}) {
  const { tenantId } = await params
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const tenant = await loadThemeTenant(tenantId)
  const vertical = tenant.verticalKey

  const [config, marketplace] = await Promise.all([
    fetchStorefrontConfig(tenant.id),
    q
      ? searchMarketplace({ tenantId, q, types: sp.types }).catch(() => ({ listings: [] as Listing[] }))
      : Promise.resolve({ listings: [] as Listing[] }),
  ])
  const listings = ((marketplace as { listings?: Listing[] }).listings ?? []) as Listing[]

  const listingsBlock =
    listings.length > 0 ? (
      <section className="sf-search-page__market">
        <h2 className="sf-heading" style={{ fontSize: 'var(--sf-text-xl)' }}>
          From the marketplace
        </h2>
        <ul className="sf-search-page__listings">
          {listings.map((l) => (
            <li key={String(l._id)}>
              <p className="sf-search-page__listing-title">{l.title}</p>
              <p className="sf-subtle">
                {l.listingType} · ₹{(l.priceInr ?? 0).toLocaleString('en-IN')}
                {l.sellerId && typeof l.sellerId === 'object' && l.sellerId.slug ? (
                  <>
                    {' · '}
                    <Link href={`/store/${l.sellerId.slug}`}>{l.sellerId.displayName}</Link>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      </section>
    ) : null

  const page = (placeholder: string, results: ReactNode) => (
    <main>
      <PageHeader title={q ? 'Search results' : 'Search'} crumbs={[{ label: 'Home', href: '/' }, { label: 'Search' }]}>
        <SearchForm q={q} placeholder={placeholder} />
      </PageHeader>
      <div className="sf-container" style={{ paddingBottom: 'var(--sf-section-y)' }}>
        {results}
        {listingsBlock}
      </div>
    </main>
  )

  if (vertical === 'restaurant') {
    const menu = await fetchMenu(tenant.id)
    const filtered: PublicMenuCategory[] = q
      ? menu
          .map((c) => ({ ...c, items: c.items.filter((i) => matches(q, i.name, i.description, c.name, ...(i.dietary ?? []))) }))
          .filter((c) => c.items.length > 0)
      : []
    const count = filtered.reduce((n, c) => n + c.items.length, 0)
    const body = page(
      'Search the menu…',
      <>
        <ResultCount q={q} count={count} noun="dish" />
        {q && count === 0 && listings.length === 0 ? <p className="sf-product-empty">No dishes match your search.</p> : null}
        {count > 0 ? <MenuSectionInteractive categories={filtered} /> : null}
      </>,
    )
    return (
      <SiteChrome tenant={tenant} config={config}>
        {body}
      </SiteChrome>
    )
  }

  if (vertical === 'home_services') {
    const services = await fetchServices(tenant.id, 100)
    const filtered: PublicService[] = q ? services.filter((s) => matches(q, s.name, s.shortDescription, s.description)) : []
    return (
      <SiteChrome tenant={tenant} config={config}>
        {page(
          'Search services…',
          <>
            <ResultCount q={q} count={filtered.length} noun="service" />
            {q && filtered.length === 0 && listings.length === 0 ? <p className="sf-product-empty">No services match your search.</p> : null}
            {filtered.length > 0 ? <ServiceGrid services={filtered} title="Matching services" showSeeAll={false} /> : null}
          </>,
        )}
      </SiteChrome>
    )
  }

  // Retail (default)
  const products = await fetchProducts(tenant.id, 200)
  const filtered: PublicProduct[] = q
    ? products.filter((p) => matches(q, p.name, p.shortDescription, p.categoryName, p.description))
    : []
  const body = page(
    'Search products…',
    <>
      <ResultCount q={q} count={filtered.length} noun="product" />
      {q && filtered.length === 0 && listings.length === 0 ? (
        <div className="sf-product-empty">
          <p>No products match your search.</p>
          <Link href="/products" className="sf-btn sf-btn--secondary" style={{ marginTop: '1rem' }}>
            Browse all products
          </Link>
        </div>
      ) : null}
      {filtered.length > 0 ? <ProductGrid products={filtered} /> : null}
    </>,
  )
  return (
    <SiteChrome tenant={tenant} config={config}>
      {body}
    </SiteChrome>
  )
}
