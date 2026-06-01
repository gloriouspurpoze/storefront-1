import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter } from '@/themes/home-services/SiteFooter'
import { ServiceGrid } from '@/themes/home-services/ServiceGrid'
import { CallToAction } from '@/themes/home-services/CallToAction'
import { toThemeTenant } from '@/themes/home-services/types'
import { fetchServices } from '@/lib/storefront-api'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadHomeServicesTenant()
  return {
    title: 'Services',
    description: `Browse all services offered by ${tenant.name}.`,
  }
}

export default async function ServicesPage() {
  const tenant = await loadHomeServicesTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const services = await fetchServices(tenant.id, 48)

  return (
    <>
      <SiteHeader tenant={themeTenant} />
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
        <CallToAction />
      </main>
      <SiteFooter tenant={themeTenant} />
    </>
  )
}
