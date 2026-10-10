import Link from 'next/link'
import Script from 'next/script'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { ResolvedTenant } from '@/lib/types'
import { fetchProductBySlug, fetchStorefrontConfig } from '@/lib/storefront-api'
import { fetchSellerStore } from '@/lib/marketplace-api'
import { buildProductBreadcrumbJsonLd, buildProductJsonLd, containsHtml, resolveStorefrontBaseUrl } from '@/lib/product-seo'
import { SiteChrome } from '@/components/chrome/SiteChrome'
import { Accordion, Breadcrumb, IconShield, IconTruck, Rating } from '@/ui'
import { MarketplaceProductMain } from './MarketplaceBuyBox'
import { ReviewsSection } from './ReviewsSection'
import { SoldByCard } from './SoldByCard'
import { ListingRail } from './ListingRail'
import '@/components/commerce/pdp.css'
import './marketplace.css'

function Description({ text }: { text: string }) {
  return containsHtml(text) ? (
    <div className="sf-pdp-description" dangerouslySetInnerHTML={{ __html: text }} />
  ) : (
    <p className="sf-pdp-description">{text}</p>
  )
}

/** Marketplace PDP: gallery, listing-keyed buy box, "Sold by", and more from the same seller. */
export async function MarketplaceProductPage({ tenant, slug }: { tenant: ResolvedTenant; slug: string }) {
  const [config, product] = await Promise.all([fetchStorefrontConfig(tenant.id), fetchProductBySlug(tenant.id, slug)])
  if (!product) notFound()

  const store = product.sellerSlug ? await fetchSellerStore(tenant.id, product.sellerSlug, { limit: 9 }) : null
  const more = (store?.listings ?? []).filter((l) => l.productSlug !== product.slug).slice(0, 8)

  const h = await headers()
  const baseUrl = resolveStorefrontBaseUrl(config, h.get('host'), h.get('x-forwarded-proto') ?? 'https')
  const siteName = config?.branding?.siteName || tenant.name
  const productLd = buildProductJsonLd(product, siteName, baseUrl)
  const breadcrumbLd = buildProductBreadcrumbJsonLd(product, baseUrl)
  const description = product.description ?? product.shortDescription ?? ''
  const seller = store?.seller

  return (
    <SiteChrome tenant={tenant} config={config}>
      <Script
        id="product-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      {breadcrumbLd ? (
        <Script
          id="product-breadcrumb-jsonld"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      ) : null}
      <main className="sf-pdp--modern sf-container">
        <div className="sf-pdp-crumbs">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Shop', href: '/products' },
              ...(product.categorySlug && product.categoryName
                ? [{ label: product.categoryName, href: `/categories/${product.categorySlug}` }]
                : []),
              { label: product.name },
            ]}
          />
        </div>
        <MarketplaceProductMain
          product={product}
          header={
            <>
              {product.categoryName ? <p className="sf-pdp-category">{product.categoryName}</p> : null}
              <h1>{product.name}</h1>
              {product.sellerName && product.sellerSlug ? (
                <p className="sf-pdp-short">
                  by <Link href={`/store/${product.sellerSlug}`}>{product.sellerName}</Link>
                </p>
              ) : null}
              {product.totalReviews ? (
                <a href="#reviews" className="mk-pdp-rating">
                  <Rating value={product.averageRating ?? 0} count={product.totalReviews} />
                </a>
              ) : null}
              {product.shortDescription && product.description ? (
                <p className="sf-pdp-short">{product.shortDescription}</p>
              ) : null}
            </>
          }
          footer={
            <>
              {seller ? <SoldByCard seller={seller} /> : null}
              <ul className="sf-pdp-perks">
                <li>
                  <IconShield size={18} /> Secure checkout through the marketplace
                </li>
                <li>
                  <IconTruck size={18} /> Shipped by the seller · track it from your account
                </li>
              </ul>
              {description ? (
                <Accordion
                  className="sf-pdp-accordion"
                  items={[{ id: 'desc', title: 'Description', content: <Description text={description} />, defaultOpen: true }]}
                />
              ) : null}
            </>
          }
        />
        <ReviewsSection tenantId={tenant.id} scope="product" slug={product.slug} />
      </main>
      {seller ? (
        <ListingRail
          eyebrow="From the same shop"
          title={`More from ${seller.displayName}`}
          listings={more}
          viewAllHref={`/store/${seller.slug}`}
          viewAllLabel="Visit shop"
        />
      ) : null}
    </SiteChrome>
  )
}
