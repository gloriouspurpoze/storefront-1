import { notFound } from 'next/navigation'
import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader as HsHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter as HsFooter } from '@/themes/home-services/SiteFooter'
import { BookingForm } from '@/themes/home-services/BookingForm'
import { toThemeTenant as toHsTenant } from '@/themes/home-services/types'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'
import { SiteHeader as RestHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter as RestFooter } from '@/themes/restaurant/SiteFooter'
import { ReservationForm } from '@/themes/restaurant/ReservationForm'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { MenuFastCardsContactPage } from '@/themes/restaurant/menufast/MenuFastCardsContactPage'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader as RetailHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter as RetailFooter } from '@/themes/retail/SiteFooter'
import { BookingForm as RetailContactForm } from '@/themes/home-services/BookingForm'
import { toThemeTenant as toRetailTenant } from '@/themes/retail/types'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { LuxeEssenceContactPage } from '@/themes/retail/luxe-essence/LuxeEssenceContactPage'
import { storefrontPathMetadata } from '@/lib/path-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return storefrontPathMetadata('/contact')
}

export default async function ContactPage() {
  const resolved = await loadTenantFromRequest()
  if (!resolved) notFound()

  switch (resolved.verticalKey) {
    case 'home_services': {
      const tenant = await loadHomeServicesTenant()
      const theme = toHsTenant(tenant, tenant.fallbackTagline)
      return (
        <>
          <HsHeader tenant={theme} />
          <main className="mx-auto grid w-full max-w-5xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Contact</p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900">Let&apos;s talk.</h1>
            </div>
            <BookingForm tenantId={tenant.id} source="contact-page" />
          </main>
          <HsFooter tenant={theme} />
        </>
      )
    }
    case 'restaurant': {
      const tenant = await loadRestaurantTenant()
      const theme = toRestTenant(tenant, tenant.fallbackTagline)
      const config = await fetchStorefrontConfig(tenant.id)
      if (config?.themeKey === 'menufast-cards') {
        return (
          <MenuFastCardsContactPage tenant={theme} config={config} tenantId={tenant.id} />
        )
      }
      return (
        <RestaurantShell tenantId={tenant.id}>
          <RestHeader tenant={theme} />
          <main className="mx-auto grid w-full max-w-5xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/80">Contact</p>
              <h1 className="mt-3 font-serif text-4xl font-bold text-stone-900">Get in touch</h1>
              <p className="mt-4 text-stone-600">Questions, events, or large parties — we read every message.</p>
            </div>
            <ReservationForm tenantId={tenant.id} />
          </main>
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
            <LuxeEssenceContactPage tenant={theme} config={config} />
          </RetailShell>
        )
      }
      return (
        <RetailShell tenantId={tenant.id}>
          <RetailHeader tenant={theme} />
          <main className="mx-auto grid w-full max-w-5xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Contact</p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900">We&apos;re here to help</h1>
              <p className="mt-4 text-slate-600">Orders, shipping, or product questions.</p>
            </div>
            <RetailContactForm tenantId={tenant.id} source="storefront-retail-contact" />
          </main>
          <RetailFooter tenant={theme} />
        </RetailShell>
      )
    }
    default:
      notFound()
  }
}
