import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchMenu, fetchProducts, fetchServices } from '@/lib/storefront-api'
import { ComingSoon } from '@/themes/coming-soon/ComingSoon'
import { SiteHeader as HsHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter as HsFooter } from '@/themes/home-services/SiteFooter'
import { Hero as HsHero } from '@/themes/home-services/Hero'
import { ServiceGrid } from '@/themes/home-services/ServiceGrid'
import { TrustSection } from '@/themes/home-services/TrustSection'
import { CallToAction } from '@/themes/home-services/CallToAction'
import { toThemeTenant as toHsTenant } from '@/themes/home-services/types'
import { SiteHeader as RestHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter as RestFooter } from '@/themes/restaurant/SiteFooter'
import { Hero as RestHero } from '@/themes/restaurant/Hero'
import { MenuSection } from '@/themes/restaurant/MenuSection'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader as RetailHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter as RetailFooter } from '@/themes/retail/SiteFooter'
import { Hero as RetailHero } from '@/themes/retail/Hero'
import { ProductGrid } from '@/themes/retail/ProductGrid'
import { toThemeTenant as toRetailTenant } from '@/themes/retail/types'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TenantHomePage() {
  const tenant = await loadTenantFromRequest()
  if (!tenant) notFound()

  switch (tenant.verticalKey) {
    case 'home_services': {
      const themeTenant = toHsTenant(tenant, 'Trusted local pros, on demand.')
      const services = await fetchServices(tenant.id, 6)
      return (
        <>
          <HsHeader tenant={themeTenant} />
          <main>
            <HsHero tenant={themeTenant} />
            <TrustSection />
            <ServiceGrid
              services={services}
              title="Popular services"
              subtitle="Hand-picked, frequently booked, instantly available."
            />
            <CallToAction />
          </main>
          <HsFooter tenant={themeTenant} />
        </>
      )
    }

    case 'restaurant': {
      const themeTenant = toRestTenant(tenant, 'Where the menu meets the moment.')
      const menu = await fetchMenu(tenant.id)
      const preview = menu.slice(0, 2)
      return (
        <>
          <RestHeader tenant={themeTenant} />
          <main>
            <RestHero tenant={themeTenant} />
            <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-serif text-2xl font-semibold text-stone-900">From our kitchen</h2>
                <Link href="/menu" className="text-sm font-medium text-amber-800 hover:underline">
                  Full menu →
                </Link>
              </div>
              <div className="mt-8">
                <MenuSection categories={preview} compact />
              </div>
            </section>
            <section className="bg-amber-50/50 py-16">
              <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
                <h2 className="font-serif text-2xl font-semibold text-stone-900">Reserve your table</h2>
                <p className="mt-2 text-stone-600">We will confirm by email within a few hours.</p>
                <Link
                  href="/reserve"
                  className="mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white"
                  style={{ backgroundColor: 'var(--site-brand)' }}
                >
                  Book now
                </Link>
              </div>
            </section>
          </main>
          <RestFooter tenant={themeTenant} />
        </>
      )
    }

    case 'retail': {
      const themeTenant = toRetailTenant(tenant, 'Curated, online, and on the way.')
      const products = await fetchProducts(tenant.id, 6)
      return (
        <RetailShell tenantId={tenant.id}>
          <RetailHeader tenant={themeTenant} />
          <main>
            <RetailHero tenant={themeTenant} />
            <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">Featured</h2>
                <Link href="/products" className="text-sm font-medium text-indigo-700 hover:underline">
                  Shop all →
                </Link>
              </div>
              <div className="mt-8">
                <ProductGrid products={products} />
              </div>
            </section>
          </main>
          <RetailFooter tenant={themeTenant} />
        </RetailShell>
      )
    }

    default:
      return <ComingSoon tenant={tenant} />
  }
}
