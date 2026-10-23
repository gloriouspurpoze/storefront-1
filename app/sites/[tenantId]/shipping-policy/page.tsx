import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant } from '@/themes/retail/types'
import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'
import { ShippingPolicyPageContent } from '@/components/ShippingPolicyPageContent'
import { LayoutThemePageShell } from '@/components/LayoutThemePageShell'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { LuxeEssenceShippingPolicyPage } from '@/themes/retail/luxe-essence/LuxeEssenceShippingPolicyPage'
import { marketplaceTenantOrNull } from '@/themes/marketplace/loadThemeTenant'
import { MarketplaceShippingPolicyPage } from '@/themes/marketplace/MarketplaceUtilityPages'
import { fetchStorefrontMenuLinks } from '@/lib/cms-content'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { isBrownButterTheme } from '@/themes/private/thebrownbutter/brownButterNav'
import { BrownButterPolicyView } from '@/themes/private/thebrownbutter/BrownButterPolicyView'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadTenantFromRequest()
  return {
    title: 'Shipping policy',
    description: tenant ? `Shipping and delivery information for ${tenant.name}` : 'Shipping policy',
  }
}

export default async function ShippingPolicyPage() {
  const resolved = await loadTenantFromRequest()
  if (!resolved) notFound()

  if (resolved.verticalKey === 'marketplace') return <MarketplaceShippingPolicyPage tenant={resolved} />

  if (resolved.verticalKey === 'restaurant') {
    const tenant = await loadRestaurantTenant()
    const config = await fetchStorefrontConfig(tenant.id)
    if (isBrownButterTheme(config?.themeKey)) {
      const navLinks = await fetchStorefrontMenuLinks(tenant.id)
      return (
        <BrownButterPolicyView
          tenant={toRestTenant(tenant, config?.branding?.tagline ?? '')}
          config={config}
          navLinks={navLinks}
        />
      )
    }
  }

  if (resolved.verticalKey !== 'retail') notFound()

  const tenant = await loadRetailTenant()
  const config = await fetchStorefrontConfig(tenant.id)
  const branding = config?.branding ?? {}
  const siteName = branding.siteName || tenant.name
  const theme = toThemeTenant(tenant, branding.tagline ?? '')

  const content = <ShippingPolicyPageContent config={config} siteName={siteName} variant="retail" />

  if (config?.themeKey === 'luxe-essence') {
    return (
      <RetailShell tenantId={tenant.id}>
        <LuxeEssenceShippingPolicyPage tenant={theme} config={config} />
      </RetailShell>
    )
  }

  if (isRetailLayoutTheme(config?.themeKey)) {
    return (
      <RetailShell tenantId={tenant.id}>
        <LayoutThemePageShell config={config} siteName={siteName} tagline={branding.tagline} wide>
          {content}
        </LayoutThemePageShell>
      </RetailShell>
    )
  }

  return (
    <RetailShell tenantId={tenant.id}>
      <SiteHeader tenant={theme} config={config} />
      {content}
      <SiteFooter tenant={theme} config={config} />
    </RetailShell>
  )
}
