import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import { fetchStorefrontMenuLinks } from '@/lib/cms-content'
import {
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
  resolveStorefrontBaseUrl,
} from '@/lib/product-seo'
import { fetchProductBySlug, fetchProducts, fetchStorefrontConfig } from '@/lib/storefront-api'
import type { PublicProduct } from '@/lib/storefront-api'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { toThemeTenant } from '@/themes/restaurant/types'
import { isBrownButterTheme } from './brownButterNav'
import { BrownButterProductDetail } from './BrownButterProductDetail'

const RELATED_LIMIT = 4

/** Same category first, then the rest of the menu — in-stock only. */
function pickRelated(product: PublicProduct, catalog: PublicProduct[]): PublicProduct[] {
  const others = catalog.filter((p) => p.id !== product.id && p.slug && p.inStock)
  const same = others.filter((p) => product.categorySlug && p.categorySlug === product.categorySlug)
  const rest = others.filter((p) => !same.includes(p))
  return [...same, ...rest].slice(0, RELATED_LIMIT)
}

export async function BrownButterProductPage({ slug }: { slug: string }) {
  const tenant = await loadRestaurantTenant()
  const theme = toThemeTenant(tenant, tenant.fallbackTagline)
  const [config, product, navLinks, catalog] = await Promise.all([
    fetchStorefrontConfig(tenant.id),
    fetchProductBySlug(tenant.id, slug),
    fetchStorefrontMenuLinks(tenant.id, 'header'),
    fetchProducts(tenant.id, 80).catch(() => [] as PublicProduct[]),
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
  // No catalog page on this store: Home (the menu) → product.
  const breadcrumbLd = buildProductBreadcrumbJsonLd(product, baseUrl, null)
  const related = pickRelated(product, catalog)

  return (
    <>
      <JsonLd id="bb-product-jsonld" data={productLd} />
      <JsonLd id="bb-product-breadcrumb-jsonld" data={breadcrumbLd} />
      <BrownButterProductDetail
        tenant={theme}
        config={config}
        product={product}
        navLinks={navLinks}
        related={related}
      />
    </>
  )
}
