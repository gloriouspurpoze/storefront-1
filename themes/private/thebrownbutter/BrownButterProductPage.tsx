import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { fetchStorefrontMenuLinks } from '@/lib/cms-content'
import {
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
  resolveStorefrontBaseUrl,
} from '@/lib/product-seo'
import { fetchProductBySlug, fetchStorefrontConfig } from '@/lib/storefront-api'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { toThemeTenant } from '@/themes/restaurant/types'
import { isBrownButterTheme } from './brownButterNav'
import { BrownButterProductDetail } from './BrownButterProductDetail'

export async function BrownButterProductPage({ slug }: { slug: string }) {
  const tenant = await loadRestaurantTenant()
  const theme = toThemeTenant(tenant, tenant.fallbackTagline)
  const [config, product, navLinks] = await Promise.all([
    fetchStorefrontConfig(tenant.id),
    fetchProductBySlug(tenant.id, slug),
    fetchStorefrontMenuLinks(tenant.id, 'header'),
  ])
  if (!product || !isBrownButterTheme(config?.themeKey)) notFound()

  const h = await headers()
  const baseUrl = resolveStorefrontBaseUrl(
    config,
    h.get('host'),
    h.get('x-forwarded-proto') ?? 'https',
  )
  const siteName = config?.branding?.siteName || tenant.name
  const productLd = buildProductJsonLd(product, siteName, baseUrl)
  const breadcrumbLd = buildProductBreadcrumbJsonLd(product, baseUrl)

  return (
    <>
      <Script
        id="bb-product-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      {breadcrumbLd ? (
        <Script
          id="bb-product-breadcrumb-jsonld"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      ) : null}
      <BrownButterProductDetail
        tenant={theme}
        config={config}
        product={product}
        navLinks={navLinks}
      />
    </>
  )
}
