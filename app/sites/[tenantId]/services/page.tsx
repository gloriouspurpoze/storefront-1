import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter } from '@/themes/home-services/SiteFooter'
import { ServiceGrid } from '@/themes/home-services/ServiceGrid'
import { CallToAction } from '@/themes/home-services/CallToAction'
import { toThemeTenant } from '@/themes/home-services/types'
import { TradeProHeader } from '@/themes/home-services/trade-pro/TradeProHeader'
import { TradeProFooter } from '@/themes/home-services/trade-pro/TradeProFooter'
import { TradeProFinalCta } from '@/themes/home-services/trade-pro/TradeProFinalCta'
import { fetchServices, fetchStorefrontConfig } from '@/lib/storefront-api'
import { fetchStorefrontMenuLinks } from '@/lib/cms-content'
import { storefrontPathMetadata } from '@/lib/path-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return storefrontPathMetadata('/services')
}

export default async function ServicesPage() {
  const tenant = await loadHomeServicesTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const [services, config] = await Promise.all([
    fetchServices(tenant.id, 48),
    fetchStorefrontConfig(tenant.id),
  ])
  const isTradePro = config?.themeKey === 'trade-pro'
  const [navLinks, footerLinks] = isTradePro
    ? await Promise.all([
        fetchStorefrontMenuLinks(tenant.id, 'header'),
        fetchStorefrontMenuLinks(tenant.id, 'footer'),
      ])
    : [undefined, undefined]
  const phone = config?.branding?.contactPhone

  return (
    <>
      {isTradePro ? (
        <TradeProHeader tenant={themeTenant} navLinks={navLinks} phone={phone} />
      ) : (
        <SiteHeader tenant={themeTenant} />
      )}
      <main>
        <section className="mx-auto w-full max-w-6xl px-4 pb-2 pt-12 sm:px-6 sm:pt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {themeTenant.name}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Everything we do.
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-slate-600">
            Tap any service to learn more or book a verified pro in seconds.
          </p>
        </section>
        <ServiceGrid services={services} title="" subtitle="" showSeeAll={false} />
        {isTradePro ? <TradeProFinalCta phone={phone} /> : <CallToAction />}
      </main>
      {isTradePro ? (
        <TradeProFooter
          tenant={themeTenant}
          navLinks={footerLinks}
          phone={phone}
          email={config?.branding?.contactEmail}
          address={config?.branding?.address}
        />
      ) : (
        <SiteFooter tenant={themeTenant} />
      )}
    </>
  )
}
