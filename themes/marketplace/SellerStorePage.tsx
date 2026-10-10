import Script from 'next/script'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { ResolvedTenant } from '@/lib/types'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { fetchSellerStore } from '@/lib/marketplace-api'
import { resolveStorefrontBaseUrl } from '@/lib/product-seo'
import { SiteChrome } from '@/components/chrome/SiteChrome'
import { Breadcrumb, Rating } from '@/ui'
import { MarketplaceCatalog } from './MarketplaceCatalog'
import { SellerAvatar, sellerLocation } from './SellerCard'
import { toListingQuery, type CatalogQuery } from './catalogQuery'
import { ReviewsSection } from './ReviewsSection'
import './marketplace.css'

export async function sellerStoreMetadata(tenant: ResolvedTenant, sellerSlug: string): Promise<Metadata> {
  const [config, store] = await Promise.all([fetchStorefrontConfig(tenant.id), fetchSellerStore(tenant.id, sellerSlug, { limit: 1 })])
  if (!store) return { title: 'Shop not found' }
  const siteName = config?.branding?.siteName || tenant.name
  const description =
    store.seller.tagline || store.seller.bio?.slice(0, 160) || `Shop ${store.seller.displayName} on ${siteName}.`
  return {
    title: `${store.seller.displayName} | ${siteName}`,
    description,
    alternates: { canonical: `/store/${store.seller.slug}` },
    openGraph: {
      title: store.seller.displayName,
      description,
      images: store.seller.bannerUrl || store.seller.logoUrl ? [store.seller.bannerUrl || store.seller.logoUrl!] : undefined,
    },
  }
}

/** Seller storefront: banner, identity, about + policies, and that seller's faceted catalog. */
export async function SellerStorePage({
  tenant,
  sellerSlug,
  query,
}: {
  tenant: ResolvedTenant
  sellerSlug: string
  query: CatalogQuery
}) {
  const [config, store] = await Promise.all([
    fetchStorefrontConfig(tenant.id),
    fetchSellerStore(tenant.id, sellerSlug, toListingQuery(query)),
  ])
  if (!store) notFound()
  const { seller } = store
  const where = sellerLocation(seller)
  const since = seller.memberSince ? new Date(seller.memberSince).getFullYear() : null

  const h = await headers()
  const baseUrl = resolveStorefrontBaseUrl(config, h.get('host'), h.get('x-forwarded-proto') ?? 'https')
  const storeLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: seller.displayName,
    description: seller.tagline || seller.bio,
    image: seller.logoUrl || seller.bannerUrl,
    url: baseUrl ? `${baseUrl}/store/${seller.slug}` : undefined,
    address: where ? { '@type': 'PostalAddress', addressLocality: seller.location?.city, addressRegion: seller.location?.state } : undefined,
    aggregateRating:
      seller.reviewCount > 0
        ? { '@type': 'AggregateRating', ratingValue: seller.rating, reviewCount: seller.reviewCount }
        : undefined,
  }

  return (
    <SiteChrome tenant={tenant} config={config}>
      <Script
        id="store-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeLd) }}
      />
      <main>
        <section className="mk-store-hero">
          <div className="sf-container">
            <div className="mk-store-hero__banner">
              {seller.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={seller.bannerUrl} alt="" />
              ) : null}
            </div>
            <div className="mk-store-hero__head">
              <SellerAvatar seller={seller} size={96} />
              <div>
                <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Sellers', href: '/sellers' }, { label: seller.displayName }]} />
                <h1 className="mk-store-hero__title">{seller.displayName}</h1>
                {seller.tagline ? <p className="mk-store-hero__tagline">{seller.tagline}</p> : null}
                <p className="mk-store-hero__meta">
                  {seller.reviewCount > 0 ? <Rating value={seller.rating} count={seller.reviewCount} /> : null}
                  {where ? <span>{where}</span> : null}
                  <span>
                    {store.pagination.total} {store.pagination.total === 1 ? 'product' : 'products'}
                  </span>
                  {since ? <span>On {tenant.name} since {since}</span> : null}
                </p>
              </div>
            </div>
            {seller.bio || seller.policies?.shippingPolicy || seller.policies?.returnPolicy ? (
              <div className="mk-store-about">
                {seller.bio ? <p className="mk-store-about__bio">{seller.bio}</p> : <span />}
                {seller.policies?.shippingPolicy || seller.policies?.returnPolicy ? (
                  <dl className="mk-policy-list">
                    {seller.policies?.shippingPolicy ? (
                      <div>
                        <dt>Shipping</dt>
                        <dd>{seller.policies.shippingPolicy}</dd>
                      </div>
                    ) : null}
                    {seller.policies?.returnPolicy ? (
                      <div>
                        <dt>Returns</dt>
                        <dd>{seller.policies.returnPolicy}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
        <div className="sf-container">
          <MarketplaceCatalog
            basePath={`/store/${seller.slug}`}
            query={query}
            page={store}
            hideSellers
            emptyTitle={`${seller.displayName} has no products matching these filters.`}
          />
        </div>
        <div className="sf-container">
          <ReviewsSection tenantId={tenant.id} scope="seller" slug={seller.slug} />
        </div>
      </main>
    </SiteChrome>
  )
}
