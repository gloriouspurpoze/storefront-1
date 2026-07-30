import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import type { StorefrontCmsPage } from '@/lib/cms-pages'
import { StorefrontCmsPageArticle } from '@/components/content/StorefrontCmsPageArticle'
import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader as HsHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter as HsFooter } from '@/themes/home-services/SiteFooter'
import { toThemeTenant as toHsTenant } from '@/themes/home-services/types'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'
import { SiteHeader as RestHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter as RestFooter } from '@/themes/restaurant/SiteFooter'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { MenuFastCardsCmsPage } from '@/themes/restaurant/menufast/MenuFastCardsCmsPage'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader as RetailHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter as RetailFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant as toRetailTenant } from '@/themes/retail/types'
import { LuxeEssenceCmsPage } from '@/themes/retail/luxe-essence/LuxeEssenceCmsPage'

/**
 * Renders any published CMS static page inside the active vertical/theme shell.
 */
export async function CmsStaticPageScreen({ page }: { page: StorefrontCmsPage }) {
  const resolved = await loadTenantFromRequest()
  if (!resolved) notFound()

  const article = <StorefrontCmsPageArticle page={page} />

  switch (resolved.verticalKey) {
    case 'home_services': {
      const tenant = await loadHomeServicesTenant()
      const theme = toHsTenant(tenant, tenant.fallbackTagline)
      return (
        <>
          <HsHeader tenant={theme} />
          <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">{article}</main>
          <HsFooter tenant={theme} />
        </>
      )
    }
    case 'restaurant': {
      const tenant = await loadRestaurantTenant()
      const theme = toRestTenant(tenant, tenant.fallbackTagline)
      const config = await fetchStorefrontConfig(tenant.id)
      if (config?.themeKey === 'menufast-cards') {
        return <MenuFastCardsCmsPage tenant={theme} config={config} page={page} />
      }
      return (
        <RestaurantShell tenantId={tenant.id}>
          <RestHeader tenant={theme} />
          <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-stone-800">{article}</main>
          <RestFooter tenant={theme} />
        </RestaurantShell>
      )
    }
    case 'retail': {
      const tenant = await loadRetailTenant()
      const theme = toRetailTenant(tenant, tenant.fallbackTagline)
      const config = await fetchStorefrontConfig(tenant.id)
      if (config?.themeKey === 'luxe-essence') {
        return (
          <RetailShell tenantId={tenant.id}>
            <LuxeEssenceCmsPage tenant={theme} config={config} page={page} />
          </RetailShell>
        )
      }
      return (
        <RetailShell tenantId={tenant.id}>
          <RetailHeader tenant={theme} />
          <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-slate-800">{article}</main>
          <RetailFooter tenant={theme} />
        </RetailShell>
      )
    }
    default:
      notFound()
  }
}
