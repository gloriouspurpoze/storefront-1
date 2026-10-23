import { notFound } from 'next/navigation'
import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader as HsHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter as HsFooter } from '@/themes/home-services/SiteFooter'
import { BookingForm } from '@/themes/home-services/BookingForm'
import { toThemeTenant as toHsTenant } from '@/themes/home-services/types'
import { TradeProHeader } from '@/themes/home-services/trade-pro/TradeProHeader'
import { TradeProFooter } from '@/themes/home-services/trade-pro/TradeProFooter'
import { TradeProShellClient } from '@/themes/home-services/trade-pro/TradeProShellClient'
import { TradeProServicePicker } from '@/themes/home-services/trade-pro/TradeProServicePicker'
import { fetchStorefrontMenuLinks } from '@/lib/cms-content'
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
import { fetchServices, fetchStorefrontConfig, fetchStorefrontCategories } from '@/lib/storefront-api'
import { LuxeEssenceContactPage } from '@/themes/retail/luxe-essence/LuxeEssenceContactPage'
import { storefrontPathMetadata } from '@/lib/path-metadata'
import { isBrownButterNavEnabled, isBrownButterTheme } from '@/themes/private/thebrownbutter/brownButterNav'
import { BrownButterTalkView } from '@/themes/private/thebrownbutter/BrownButterTalkView'

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
      const config = await fetchStorefrontConfig(tenant.id)
      const isTradePro = config?.themeKey === 'trade-pro'
      const [navLinks, footerLinks] = isTradePro
        ? await Promise.all([
            fetchStorefrontMenuLinks(tenant.id, 'header'),
            fetchStorefrontMenuLinks(tenant.id, 'footer'),
          ])
        : [undefined, undefined]
      if (isTradePro) {
        const services = await fetchServices(tenant.id, 24)
        return (
          <TradeProShellClient tenantId={tenant.id}>
            <TradeProHeader
              tenant={theme}
              navLinks={navLinks}
              phone={config?.branding?.contactPhone}
              serviceArea={config?.branding?.address}
            />
            <main className="sf-container grid gap-12 py-16 lg:grid-cols-2">
              <div>
                <p className="sf-page-eyebrow">Contact</p>
                <h1 className="sf-page-title">Let&apos;s talk.</h1>
                <p className="sf-page-lead">
                  Add the services you need, then send one enquiry from your cart. We&apos;ll call
                  you back within 2 hours.
                </p>
              </div>
              <TradeProServicePicker services={services} title="Start your enquiry" />
            </main>
            <TradeProFooter tenant={theme} config={config} navLinks={footerLinks} />
          </TradeProShellClient>
        )
      }
      return (
        <>
          <HsHeader tenant={theme} />
          <main className="sf-container grid gap-12 py-16 lg:grid-cols-2">
            <div>
              <p className="sf-page-eyebrow">Contact</p>
              <h1 className="sf-page-title">Let&apos;s talk.</h1>
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
      if (isBrownButterTheme(config?.themeKey)) {
        if (!isBrownButterNavEnabled(config, 'showTalkNav')) notFound()
        const navLinks = await fetchStorefrontMenuLinks(tenant.id, 'header')
        return <BrownButterTalkView tenant={theme} config={config} navLinks={navLinks} />
      }
      if (config?.themeKey === 'menufast-cards') {
        return (
          <MenuFastCardsContactPage tenant={theme} config={config} tenantId={tenant.id} />
        )
      }
      return (
        <RestaurantShell tenantId={tenant.id}>
          <RestHeader tenant={theme} />
          <main className="sf-container grid gap-12 py-16 lg:grid-cols-2">
            <div>
              <p className="sf-page-eyebrow">Contact</p>
              <h1 className="sf-page-title">Get in touch</h1>
              <p className="sf-page-lead">Questions, events, or large parties — we read every message.</p>
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
        const categories = await fetchStorefrontCategories(tenant.id)
        return (
          <RetailShell tenantId={tenant.id}>
            <LuxeEssenceContactPage tenant={theme} config={config} categories={categories} />
          </RetailShell>
        )
      }
      return (
        <RetailShell tenantId={tenant.id}>
          <RetailHeader tenant={theme} />
          <main className="sf-container grid gap-12 py-16 lg:grid-cols-2">
            <div>
              <p className="sf-page-eyebrow">Contact</p>
              <h1 className="sf-page-title">We&apos;re here to help</h1>
              <p className="sf-page-lead">Orders, shipping, or product questions.</p>
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
