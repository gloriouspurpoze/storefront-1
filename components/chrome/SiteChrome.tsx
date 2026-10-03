import type { ReactNode } from 'react'
import type { ResolvedTenant } from '@/lib/types'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { fetchStorefrontNavLinks } from '@/lib/cms-content'
import { LayoutThemePageShell } from '@/components/LayoutThemePageShell'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader as RetailHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter as RetailFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant as toRetailTenant } from '@/themes/retail/types'
import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'
import { SiteHeader as RestHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter as RestFooter } from '@/themes/restaurant/SiteFooter'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { isRestaurantLayoutTheme } from '@/themes/restaurant/restaurantLayoutRouter'
import { SiteHeader as HsHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter as HsFooter } from '@/themes/home-services/SiteFooter'
import { toThemeTenant as toHsTenant } from '@/themes/home-services/types'

/**
 * The one page frame for vertical-agnostic routes (search, marketplace seller
 * pages, …): the right cart provider, header and footer for the tenant's
 * vertical, or the layout theme's shell. Header/footer self-fetch nav links.
 */
export async function SiteChrome({
  tenant,
  config,
  children,
}: {
  tenant: ResolvedTenant
  config: StorefrontConfig | null
  children: ReactNode
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline ?? ''
  // Layout-theme shells are client components, so fetch their CMS links here.
  const layoutTheme =
    (tenant.verticalKey === 'restaurant' && isRestaurantLayoutTheme(config?.themeKey)) ||
    (tenant.verticalKey === 'retail' && isRetailLayoutTheme(config?.themeKey))
  const shellLinks = layoutTheme ? await fetchStorefrontNavLinks(tenant.id, 'header', tenant.verticalKey) : undefined

  if (tenant.verticalKey === 'restaurant') {
    const t = toRestTenant(tenant, tagline)
    return (
      <RestaurantShell tenantId={tenant.id}>
        {isRestaurantLayoutTheme(config?.themeKey) ? (
          <LayoutThemePageShell config={config} siteName={siteName} tagline={tagline} variant="restaurant" navLinks={shellLinks}>
            {children}
          </LayoutThemePageShell>
        ) : (
          <>
            <RestHeader tenant={t} config={config} />
            {children}
            <RestFooter tenant={t} config={config} />
          </>
        )}
      </RestaurantShell>
    )
  }

  if (tenant.verticalKey === 'home_services') {
    const t = toHsTenant(tenant, tagline)
    return (
      <>
        <HsHeader tenant={t} />
        {children}
        <HsFooter tenant={t} config={config} />
      </>
    )
  }

  const t = toRetailTenant(tenant, tagline)
  return (
    <RetailShell tenantId={tenant.id}>
      {isRetailLayoutTheme(config?.themeKey) ? (
        <LayoutThemePageShell config={config} siteName={siteName} tagline={tagline} wide navLinks={shellLinks}>
          {children}
        </LayoutThemePageShell>
      ) : (
        <>
          <RetailHeader tenant={t} config={config} />
          {children}
          <RetailFooter tenant={t} config={config} />
        </>
      )}
    </RetailShell>
  )
}
