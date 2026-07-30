import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { ProductGrid } from '@/themes/retail/ProductGrid'
import { toThemeTenant } from '@/themes/retail/types'
import { fetchProducts, fetchStorefrontConfig } from '@/lib/storefront-api'
import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'
import { LayoutThemePageShell } from '@/components/LayoutThemePageShell'
import { storefrontPathMetadata } from '@/lib/path-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return storefrontPathMetadata('/products')
}

export default async function ProductsPage() {
  const tenant = await loadRetailTenant()
  const config = await fetchStorefrontConfig(tenant.id)
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const products = await fetchProducts(tenant.id, 48)
  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline || themeTenant.tagline

  const main = (
    <main className="sf-page-shell">
      <h1 className="sf-page-title">Shop all</h1>
      <p className="sf-page-lead">{themeTenant.tagline}</p>
      <div className="sf-page-body sf-page-body--tight">
        <ProductGrid products={products} />
      </div>
    </main>
  )

  if (isRetailLayoutTheme(config?.themeKey)) {
    return (
      <RetailShell tenantId={tenant.id}>
        <LayoutThemePageShell config={config} siteName={siteName} tagline={tagline} wide>
          {main}
        </LayoutThemePageShell>
      </RetailShell>
    )
  }

  return (
    <RetailShell tenantId={tenant.id}>
      <SiteHeader tenant={themeTenant} />
      {main}
      <SiteFooter tenant={themeTenant} />
    </RetailShell>
  )
}
