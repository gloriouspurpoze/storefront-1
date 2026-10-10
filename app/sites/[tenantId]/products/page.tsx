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

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return storefrontPathMetadata('/products')
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
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
