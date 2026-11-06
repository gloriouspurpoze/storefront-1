import { permanentRedirect } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { isBrownButterTheme } from '@/themes/private/thebrownbutter/brownButterNav'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { CatalogView } from '@/components/commerce/CatalogView'
import { PageHeader } from '@/ui'
import { toThemeTenant } from '@/themes/retail/types'
import {
  fetchProducts,
  fetchStorefrontCategories,
  fetchStorefrontConfig,
} from '@/lib/storefront-api'
import { fetchStorefrontMenuLinks, fetchStorefrontNavLinks } from '@/lib/cms-content'
import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'
import { LayoutThemePageShell } from '@/components/LayoutThemePageShell'
import { LuxeEssenceCatalogPage } from '@/themes/retail/luxe-essence/LuxeEssenceCatalogPage'
import { storefrontPathMetadata } from '@/lib/path-metadata'
import { marketplaceTenantOrNull } from '@/themes/marketplace/loadThemeTenant'
import { MarketplaceCatalogPage } from '@/themes/marketplace/MarketplaceCatalogPage'
import { parseCatalogQuery } from '@/themes/marketplace/catalogQuery'
import { seoOverridable } from '@/lib/tenant-seo'

export const dynamic = 'force-dynamic'

async function baseGenerateMetadata() {
  return storefrontPathMetadata('/products')
}

/**
 * Brown Butter sells from the homepage menu; there is no separate catalog page.
 * (loading.tsx streams first, so this lands as an instant meta-refresh redirect.)
 */
async function redirectBrownButterCatalog() {
  const resolved = await loadTenantFromRequest()
  if (resolved?.verticalKey !== 'restaurant') return
  const cfg = await fetchStorefrontConfig(resolved.id)
  if (isBrownButterTheme(cfg?.themeKey)) permanentRedirect('/')
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await redirectBrownButterCatalog()
  const marketplace = await marketplaceTenantOrNull()
  if (marketplace) {
    return <MarketplaceCatalogPage tenant={marketplace} mode="all" query={parseCatalogQuery(await searchParams)} />
  }
  const tenant = await loadRetailTenant()
  const config = await fetchStorefrontConfig(tenant.id)
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const themeKey = config?.themeKey
  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline || themeTenant.tagline

  if (themeKey === 'luxe-essence') {
    const [products, categories, navLinks, footerLinks] = await Promise.all([
      fetchProducts(tenant.id, 48),
      fetchStorefrontCategories(tenant.id),
      fetchStorefrontMenuLinks(tenant.id, 'header'),
      fetchStorefrontMenuLinks(tenant.id, 'footer'),
    ])
    return (
      <RetailShell tenantId={tenant.id}>
        <LuxeEssenceCatalogPage
          products={products}
          categories={categories}
          tenant={themeTenant}
          config={config}
          navLinks={navLinks}
          footerLinks={footerLinks}
        />
      </RetailShell>
    )
  }

  const [products, categories, headerNavLinks, footerNavLinks] = await Promise.all([
    fetchProducts(tenant.id, 96),
    fetchStorefrontCategories(tenant.id),
    fetchStorefrontNavLinks(tenant.id, 'header', 'retail'),
    fetchStorefrontNavLinks(tenant.id, 'footer', 'retail'),
  ])

  const main = (
    <main>
      <PageHeader title="Shop all" crumbs={[{ label: 'Home', href: '/' }, { label: 'Shop all' }]}>
        <p className="sf-subtle" style={{ marginTop: '0.5rem' }}>{themeTenant.tagline}</p>
      </PageHeader>
      <div className="sf-container">
        <CatalogView products={products} categories={categories} />
      </div>
    </main>
  )

  if (isRetailLayoutTheme(themeKey)) {
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
      <SiteHeader tenant={themeTenant} config={config} navLinks={headerNavLinks} categories={categories} />
      {main}
      <SiteFooter tenant={themeTenant} navLinks={footerNavLinks} config={config} />
    </RetailShell>
  )
}

export const generateMetadata = seoOverridable((p) => '/products', baseGenerateMetadata)
