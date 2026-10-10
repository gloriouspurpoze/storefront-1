import Link from 'next/link'
import type { ResolvedTenant } from '@/lib/types'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { fetchSellers } from '@/lib/marketplace-api'
import { SiteChrome } from '@/components/chrome/SiteChrome'
import { PageHeader } from '@/ui'
import { SellerCard } from './SellerCard'
import './marketplace.css'

/** `/sellers` — searchable, paginated directory of active sellers (featured first). */
export async function SellersDirectoryPage({ tenant, q, page }: { tenant: ResolvedTenant; q?: string; page?: number }) {
  const [config, data] = await Promise.all([
    fetchStorefrontConfig(tenant.id),
    fetchSellers(tenant.id, { q, page, limit: 24 }),
  ])
  const current = Math.max(page ?? 1, 1)
  const href = (p: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/sellers?${qs}` : '/sellers'
  }

  return (
    <SiteChrome tenant={tenant} config={config}>
      <main>
        <PageHeader title="Sellers" crumbs={[{ label: 'Home', href: '/' }, { label: 'Sellers' }]}>
          <p className="sf-page-head__sub">
            {data.pagination.total.toLocaleString('en-IN')} independent {data.pagination.total === 1 ? 'shop' : 'shops'} on{' '}
            {config?.branding?.siteName || tenant.name}.
          </p>
        </PageHeader>
        <div className="sf-container" style={{ paddingBottom: 'var(--sf-section-y)' }}>
          <form action="/sellers" role="search" className="mk-hero__search" style={{ maxWidth: 520, marginBottom: '1.5rem' }}>
            <input type="search" name="q" defaultValue={q} placeholder="Find a seller by name or city…" aria-label="Search sellers" />
            <button type="submit" className="sf-btn sf-btn--pill">
              Search
            </button>
          </form>
          {data.sellers.length ? (
            <ul className="mk-seller-grid">
              {data.sellers.map((s) => (
                <li key={s.id}>
                  <SellerCard seller={s} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="sf-product-empty">
              <p>{q ? `No sellers match “${q}”.` : 'No sellers yet.'}</p>
              <p>
                Want to be the first? <Link href="/sell">Start selling</Link>.
              </p>
            </div>
          )}
          {data.pagination.totalPages > 1 ? (
            <nav className="mk-pagination" aria-label="Pagination">
              {current > 1 ? (
                <Link href={href(current - 1)} className="sf-btn sf-btn--secondary sf-btn--sm" rel="prev">
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="mk-pagination__status">
                Page {current} of {data.pagination.totalPages}
              </span>
              {current < data.pagination.totalPages ? (
                <Link href={href(current + 1)} className="sf-btn sf-btn--secondary sf-btn--sm" rel="next">
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </div>
      </main>
    </SiteChrome>
  )
}
