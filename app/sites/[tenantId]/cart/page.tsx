import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { CartClient } from '@/themes/retail/CartClient'
import { toThemeTenant } from '@/themes/retail/types'
import { fetchStorefrontConfig, fetchStorefrontCategories } from '@/lib/storefront-api'
import { fetchStorefrontMenuLinks, fetchStorefrontNavLinks } from '@/lib/cms-content'
import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'
import { LayoutThemePageShell } from '@/components/LayoutThemePageShell'
import { LuxeEssenceCartPage } from '@/themes/retail/luxe-essence/LuxeEssenceCartPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadRetailTenant()
  return { title: 'Cart', description: `Your cart at ${tenant.name}.` }
}

export default async function CartPage() {
  const h = await headers()
  const vertical = h.get('x-tenant-vertical')
  if (vertical !== 'retail') notFound()

  const tenant = await loadRetailTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const [config, headerNavLinks, footerNavLinks, cmsHeaderNav, cmsFooterNav, categories] =
    await Promise.all([
      fetchStorefrontConfig(tenant.id),
      fetchStorefrontNavLinks(tenant.id, 'header', 'retail'),
      fetchStorefrontNavLinks(tenant.id, 'footer', 'retail'),
      fetchStorefrontMenuLinks(tenant.id, 'header'),
      fetchStorefrontMenuLinks(tenant.id, 'footer'),
      fetchStorefrontCategories(tenant.id),
    ])
  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline || themeTenant.tagline
  const themeKey = config?.themeKey

  if (themeKey === 'luxe-essence') {
    return (
      <RetailShell tenantId={tenant.id}>
        <LuxeEssenceCartPage
          tenant={themeTenant}
          config={config}
          navLinks={cmsHeaderNav}
          footerLinks={cmsFooterNav}
          categories={categories}
        />
      </RetailShell>
    )
  }

  const main = (
    <main className="sf-page-shell">
      <h1 className="sf-page-title">Your cart</h1>
      <div className="sf-page-body">
        <CartClient themeKey={themeKey} />
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
