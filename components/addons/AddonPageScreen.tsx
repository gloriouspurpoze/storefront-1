import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import type { ResolvedTenant } from '@/lib/types'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { fetchStorefrontMenuLinks } from '@/lib/cms-content'
import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader as HsHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter as HsFooter } from '@/themes/home-services/SiteFooter'
import { toThemeTenant as toHsTenant } from '@/themes/home-services/types'
import { TradeProHeader } from '@/themes/home-services/trade-pro/TradeProHeader'
import { TradeProFooter } from '@/themes/home-services/trade-pro/TradeProFooter'
import { TradeProShellClient } from '@/themes/home-services/trade-pro/TradeProShellClient'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'
import { SiteHeader as RestHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter as RestFooter } from '@/themes/restaurant/SiteFooter'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader as RetailHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter as RetailFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant as toRetailTenant } from '@/themes/retail/types'

/**
 * Wraps an add-on page (`/amc`, `/wholesale`) in the vertical's site chrome.
 * Trade Pro keeps its own header/footer; every other theme uses the vertical's standard chrome
 * (layout themes don't expose standalone header/footer components for arbitrary pages).
 */
export async function AddonPageScreen({
  resolved,
  config,
  children,
}: {
  resolved: ResolvedTenant
  config: StorefrontConfig | null
  children: ReactNode
}) {
  const body = <main className="bg-white text-slate-900">{children}</main>

  switch (resolved.verticalKey) {
    case 'home_services': {
      const tenant = await loadHomeServicesTenant()
      const theme = toHsTenant(tenant, tenant.fallbackTagline)
      if (config?.themeKey === 'trade-pro') {
        const [navLinks, footerLinks] = await Promise.all([
          fetchStorefrontMenuLinks(tenant.id, 'header'),
          fetchStorefrontMenuLinks(tenant.id, 'footer'),
        ])
        return (
          <TradeProShellClient tenantId={tenant.id}>
            <TradeProHeader
              tenant={theme}
              navLinks={navLinks}
              phone={config?.branding?.contactPhone}
              serviceArea={config?.branding?.address}
            />
            {body}
            <TradeProFooter tenant={theme} config={config} navLinks={footerLinks} />
          </TradeProShellClient>
        )
      }
      return (
        <>
          <HsHeader tenant={theme} />
          {body}
          <HsFooter tenant={theme} />
        </>
      )
    }
    case 'restaurant': {
      const tenant = await loadRestaurantTenant()
      const theme = toRestTenant(tenant, tenant.fallbackTagline)
      return (
        <RestaurantShell tenantId={tenant.id}>
          <RestHeader tenant={theme} config={config} />
          {body}
          <RestFooter tenant={theme} />
        </RestaurantShell>
      )
    }
    case 'retail': {
      const tenant = await loadRetailTenant()
      const theme = toRetailTenant(tenant, tenant.fallbackTagline)
      return (
        <RetailShell tenantId={tenant.id}>
          <RetailHeader tenant={theme} config={config} />
          {body}
          <RetailFooter tenant={theme} />
        </RetailShell>
      )
    }
    default:
      notFound()
  }
}
