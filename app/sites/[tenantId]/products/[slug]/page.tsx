import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { fetchStorefrontFaqs, fetchStorefrontNavLinks } from '@/lib/cms-content'
import { fetchProductBySlug, fetchStorefrontConfig } from '@/lib/storefront-api'
import { toThemeTenant } from '@/themes/retail/types'
import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'
import { ProductDetailView } from '@/components/ProductDetailView'
import {
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
  buildProductMetadata,
  resolveStorefrontBaseUrl,
} from '@/lib/product-seo'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const tenant = await loadRetailTenant()
  const [product, config] = await Promise.all([
    fetchProductBySlug(tenant.id, slug),
    fetchStorefrontConfig(tenant.id),
  ])
  if (!product) return { title: 'Product' }

  const h = await headers()
  const baseUrl = resolveStorefrontBaseUrl(
    config,
    h.get('host'),
    h.get('x-forwarded-proto') ?? 'https',
  )
  const siteName = config?.branding?.siteName || tenant.name
  return buildProductMetadata(product, config, siteName, baseUrl)
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const tenant = await loadRetailTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const [config, product, headerNavLinks, footerNavLinks, faqs] = await Promise.all([
    fetchStorefrontConfig(tenant.id),
    fetchProductBySlug(tenant.id, slug),
    fetchStorefrontNavLinks(tenant.id, 'header', 'retail'),
    fetchStorefrontNavLinks(tenant.id, 'footer', 'retail'),
    fetchStorefrontFaqs(tenant.id),
  ])
  if (!product) notFound()

  const isLayout = isRetailLayoutTheme(config?.themeKey)
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
    <RetailShell tenantId={tenant.id}>
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
      <ProductDetailView
        product={product}
        tenant={themeTenant}
        config={config}
        themeKey={config?.themeKey}
        navLinks={headerNavLinks}
        faqs={faqs}
      />
      {!isLayout ? <SiteFooter tenant={themeTenant} navLinks={footerNavLinks} /> : null}
    </RetailShell>
  )
}
