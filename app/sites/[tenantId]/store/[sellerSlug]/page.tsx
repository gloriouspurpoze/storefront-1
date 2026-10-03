import Link from 'next/link'
import { fetchSellerStore } from '@/lib/runMarketplaceCheckout'
import { loadThemeTenant } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { SiteChrome } from '@/components/chrome/SiteChrome'
import { PageHeader, Rating } from '@/ui'

export default async function SellerStorePage({
  params,
}: {
  params: Promise<{ tenantId: string; sellerSlug: string }>
}) {
  const { tenantId, sellerSlug } = await params
  const tenant = await loadThemeTenant(tenantId)
  const [config, data] = await Promise.all([
    fetchStorefrontConfig(tenant.id),
    fetchSellerStore({ tenantId, sellerSlug }).catch(() => null),
  ])

  if (!data) {
    return (
      <SiteChrome tenant={tenant} config={config}>
        <main className="sf-container sf-container--narrow" style={{ paddingBlock: 'var(--sf-section-y)' }}>
          <div className="sf-product-empty">
            <p>Seller not found.</p>
            <Link href="/search" className="sf-btn sf-btn--secondary" style={{ marginTop: '1rem' }}>
              Back to search
            </Link>
          </div>
        </main>
      </SiteChrome>
    )
  }

  const seller = data.seller as { displayName?: string; slug?: string; rating?: number }
  const listings = (data.listings ?? []) as Array<{
    _id?: string
    title?: string
    listingType?: string
    priceInr?: number
  }>
  const name = seller.displayName ?? sellerSlug

  return (
    <SiteChrome tenant={tenant} config={config}>
      <main>
        <PageHeader
          title={name}
          crumbs={[
            { label: 'Home', href: '/' },
            { label: 'Search', href: '/search' },
            { label: name },
          ]}
        >
          {seller.rating != null && seller.rating > 0 ? (
            <div style={{ marginTop: '0.75rem' }}>
              <Rating value={seller.rating} />
            </div>
          ) : null}
        </PageHeader>
        <div className="sf-container" style={{ paddingBottom: 'var(--sf-section-y)' }}>
          <h2 className="sf-heading" style={{ fontSize: 'var(--sf-text-xl)' }}>
            Listings
          </h2>
          {listings.length === 0 ? (
            <p className="sf-product-empty">This seller has no active listings.</p>
          ) : (
            <ul className="sf-search-page__listings">
              {listings.map((l) => (
                <li key={String(l._id)}>
                  <p className="sf-search-page__listing-title">{l.title}</p>
                  <p className="sf-subtle">
                    {l.listingType} · ₹{(l.priceInr ?? 0).toLocaleString('en-IN')}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/search" className="sf-btn sf-btn--secondary" style={{ marginTop: '2rem' }}>
            Search marketplace
          </Link>
        </div>
      </main>
    </SiteChrome>
  )
}
