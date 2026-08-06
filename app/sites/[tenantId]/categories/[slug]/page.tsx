import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CategoryMarketingBlocks } from '@/components/CategoryMarketingBlocks'
import { LayoutThemePageShell } from '@/components/LayoutThemePageShell'
import {
  categoryMarketingForSlug,
  normalizeCategoryMarketingRecord,
} from '@/lib/categoryMarketing'
import { fetchStorefrontMenuLinks, fetchStorefrontNavLinks } from '@/lib/cms-content'
import { mergeStorefrontCategories } from '@/lib/productCategories'
import {
  fetchCategoryMarketing,
  fetchProducts,
  fetchStorefrontCategories,
  fetchStorefrontConfig,
  type PublicProduct,
} from '@/lib/storefront-api'
import { ProductGrid } from '@/themes/retail/ProductGrid'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { toThemeTenant } from '@/themes/retail/types'
import { LuxeEssenceCategoryPage } from '@/themes/retail/luxe-essence/LuxeEssenceCategoryPage'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

function productCategorySlug(product: PublicProduct): string | undefined {
  const raw = product as PublicProduct & { category_slug?: string }
  return product.categorySlug?.trim() || raw.category_slug?.trim()
}

function filterProductsByCategory(products: PublicProduct[], slug: string): PublicProduct[] {
  const key = slug.trim().toLowerCase()
  return products.filter((product) => productCategorySlug(product)?.toLowerCase() === key)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tenant = await loadRetailTenant()
  const [config, categoryMarketingRaw, catalogCategories] = await Promise.all([
    fetchStorefrontConfig(tenant.id),
    fetchCategoryMarketing(tenant.id),
    fetchStorefrontCategories(tenant.id),
  ])
  const siteName = config?.branding?.siteName || tenant.name
  const marketing = categoryMarketingForSlug(
    normalizeCategoryMarketingRecord(categoryMarketingRaw),
    slug,
  )
  const catalogName = catalogCategories.find((c) => c.slug.trim().toLowerCase() === slug.trim().toLowerCase())
    ?.name
  const title =
    marketing?.seoTitle?.trim() ||
    marketing?.mainHeading?.trim() ||
    catalogName ||
    slug.replace(/-/g, ' ')

  return {
    title: `${title} | ${siteName}`,
    description:
      marketing?.metaDescription?.trim() ||
      marketing?.intro?.replace(/<[^>]+>/g, '').slice(0, 160) ||
      `Shop ${title} at ${siteName}.`,
  }
}

export default async function CategorySlugPage({ params }: PageProps) {
  const { slug: rawSlug } = await params
  const slug = rawSlug.trim().toLowerCase()
  if (!slug) notFound()

  const h = await headers()
  const vertical = h.get('x-tenant-vertical')
  if (vertical && vertical !== 'retail') notFound()

  const tenant = await loadRetailTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const [
    config,
    products,
    catalogCategories,
    categoryMarketingRaw,
    cmsHeaderNav,
    cmsFooterNav,
    headerNavLinks,
    footerNavLinks,
  ] = await Promise.all([
    fetchStorefrontConfig(tenant.id),
    fetchProducts(tenant.id, 80),
    fetchStorefrontCategories(tenant.id),
    fetchCategoryMarketing(tenant.id),
    fetchStorefrontMenuLinks(tenant.id, 'header'),
    fetchStorefrontMenuLinks(tenant.id, 'footer'),
    fetchStorefrontNavLinks(tenant.id, 'header', 'retail'),
    fetchStorefrontNavLinks(tenant.id, 'footer', 'retail'),
  ])

  const categoryMarketing = normalizeCategoryMarketingRecord(categoryMarketingRaw)
  const marketing = categoryMarketingForSlug(categoryMarketing, slug)
  const navCategories = mergeStorefrontCategories(
    catalogCategories.map((c) => ({
      slug: c.slug,
      name: c.name,
      sortOrder: c.sortOrder ?? 100,
    })),
    products,
  )
  const categoryMeta = navCategories.find((c) => c.slug.toLowerCase() === slug)
  const filtered = filterProductsByCategory(products, slug)

  if (!categoryMeta && !marketing && filtered.length === 0) {
    notFound()
  }

  const categoryName =
    categoryMeta?.name ||
    marketing?.mainHeading?.trim() ||
    slug.replace(/-/g, ' ')

  if (config?.themeKey === 'luxe-essence') {
    return (
      <RetailShell tenantId={tenant.id}>
        <LuxeEssenceCategoryPage
          categoryName={categoryName}
          categorySlug={slug}
          products={filtered}
          categories={navCategories}
          marketing={marketing}
          tenant={themeTenant}
          config={config}
          navLinks={cmsHeaderNav}
          footerLinks={cmsFooterNav}
        />
      </RetailShell>
    )
  }

  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline || themeTenant.tagline

  const main = (
    <main className="sf-page-shell">
      <p className="sf-page-eyebrow">Category</p>
      <h1 className="sf-page-title">{categoryName}</h1>
      {marketing ? <CategoryMarketingBlocks config={marketing} /> : null}
      <div className="sf-page-body sf-page-body--tight">
        {filtered.length === 0 ? (
          <p className="sf-page-lead">No products in this category yet.</p>
        ) : (
          <ProductGrid products={filtered} />
        )}
      </div>
    </main>
  )

  if (isRetailLayoutTheme(config?.themeKey)) {
    return (
      <RetailShell tenantId={tenant.id}>
        <LayoutThemePageShell
          config={config}
          siteName={siteName}
          tagline={tagline}
          wide
          navLinks={headerNavLinks}
        >
          {main}
        </LayoutThemePageShell>
      </RetailShell>
    )
  }

  return (
    <RetailShell tenantId={tenant.id}>
      <SiteHeader tenant={themeTenant} config={config} navLinks={headerNavLinks} />
      {main}
      <SiteFooter tenant={themeTenant} navLinks={footerNavLinks} />
    </RetailShell>
  )
}
