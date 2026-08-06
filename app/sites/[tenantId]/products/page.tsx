import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { ProductGrid } from '@/themes/retail/ProductGrid'
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

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return storefrontPathMetadata('/products')
}

export default async function ProductsPage() {
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

  const [products, headerNavLinks, footerNavLinks] = await Promise.all([
    fetchProducts(tenant.id, 48),
    fetchStorefrontNavLinks(tenant.id, 'header', 'retail'),
    fetchStorefrontNavLinks(tenant.id, 'footer', 'retail'),
  ])

  const main = (
    <main className="sf-page-shell">
      <h1 className="sf-page-title">Shop all</h1>
      <p className="sf-page-lead">{themeTenant.tagline}</p>
      <div className="sf-page-body sf-page-body--tight">
        <ProductGrid products={products} />
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
      <SiteHeader tenant={themeTenant} config={config} navLinks={headerNavLinks} />
      {main}
      <SiteFooter tenant={themeTenant} navLinks={footerNavLinks} />
    </RetailShell>
  )
}
