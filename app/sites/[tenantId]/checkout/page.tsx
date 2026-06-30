import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader as RestHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter as RestFooter } from '@/themes/restaurant/SiteFooter'
import { SiteHeader as RetailHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter as RetailFooter } from '@/themes/retail/SiteFooter'
import { RestaurantCheckoutClient } from '@/themes/restaurant/RestaurantCheckoutClient'
import { CheckoutClient } from '@/themes/retail/CheckoutClient'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { toThemeTenant as toRetailTenant } from '@/themes/retail/types'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { showPreferredDateOfDelivery } from '@/lib/templateSettings'
import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'
import { isRestaurantLayoutTheme } from '@/themes/restaurant/restaurantLayoutRouter'
import { LayoutThemePageShell } from '@/components/LayoutThemePageShell'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const h = await headers()
  const vertical = h.get('x-tenant-vertical')
  const tenant =
    vertical === 'restaurant' ? await loadRestaurantTenant() : await loadRetailTenant()
  return { title: 'Checkout', description: `Checkout at ${tenant.name}.` }
}

export default async function CheckoutPage() {
  const h = await headers()
  const vertical = h.get('x-tenant-vertical')

  if (vertical === 'restaurant') {
    const tenant = await loadRestaurantTenant()
    const themeTenant = toRestTenant(tenant, tenant.fallbackTagline)
    const config = await fetchStorefrontConfig(tenant.id)
    const showPreferredDate = showPreferredDateOfDelivery(config, config?.themeKey)
    const siteName = config?.branding?.siteName || tenant.name
    const tagline = config?.branding?.tagline || themeTenant.tagline

    const main = (
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Checkout</h1>
        <div className="mt-8">
          <RestaurantCheckoutClient tenant={themeTenant} config={config} showPreferredDate={showPreferredDate} />
        </div>
      </main>
    )

    if (isRestaurantLayoutTheme(config?.themeKey)) {
      return (
        <RestaurantShell tenantId={tenant.id}>
          <LayoutThemePageShell config={config} siteName={siteName} tagline={tagline} showShippingPolicy variant="restaurant">
            {main}
          </LayoutThemePageShell>
        </RestaurantShell>
      )
    }

    return (
      <RestaurantShell tenantId={tenant.id}>
        <RestHeader tenant={themeTenant} config={config} />
        {main}
        <RestFooter tenant={themeTenant} />
      </RestaurantShell>
    )
  }

  if (vertical === 'retail') {
    const tenant = await loadRetailTenant()
    const themeTenant = toRetailTenant(tenant, tenant.fallbackTagline)
    const config = await fetchStorefrontConfig(tenant.id)
    const showPreferredDate = showPreferredDateOfDelivery(config, config?.themeKey)
    const siteName = config?.branding?.siteName || tenant.name
    const tagline = config?.branding?.tagline || themeTenant.tagline

    const main = (
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
        <div className="mt-8">
          <CheckoutClient tenant={themeTenant} config={config} showPreferredDate={showPreferredDate} />
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
        <RetailHeader tenant={themeTenant} config={config} />
        {main}
        <RetailFooter tenant={themeTenant} />
      </RetailShell>
    )
  }

  notFound()
}
