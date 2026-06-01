import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader as HsHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter as HsFooter } from '@/themes/home-services/SiteFooter'
import { toThemeTenant as toHsTenant } from '@/themes/home-services/types'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { SiteHeader as RestHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter as RestFooter } from '@/themes/restaurant/SiteFooter'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader as RetailHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter as RetailFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant as toRetailTenant } from '@/themes/retail/types'

export const dynamic = 'force-dynamic'

function AboutCopy({ name }: { name: string }) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] opacity-70">About</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Our story</h1>
      <p className="mt-6 max-w-prose text-pretty opacity-90">
        {name} is built on quality, care, and consistency. Whether you are visiting for the first
        time or returning as a regular, we are glad you are here.
      </p>
    </>
  )
}

export default async function AboutPage() {
  const resolved = await loadTenantFromRequest()
  if (!resolved) notFound()

  switch (resolved.verticalKey) {
    case 'home_services': {
      const tenant = await loadHomeServicesTenant()
      const theme = toHsTenant(tenant, tenant.fallbackTagline)
      return (
        <>
          <HsHeader tenant={theme} />
          <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <AboutCopy name={theme.name} />
          </main>
          <HsFooter tenant={theme} />
        </>
      )
    }
    case 'restaurant': {
      const tenant = await loadRestaurantTenant()
      const theme = toRestTenant(tenant, tenant.fallbackTagline)
      return (
        <>
          <RestHeader tenant={theme} />
          <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-stone-800">
            <AboutCopy name={theme.name} />
          </main>
          <RestFooter tenant={theme} />
        </>
      )
    }
    case 'retail': {
      const tenant = await loadRetailTenant()
      const theme = toRetailTenant(tenant, tenant.fallbackTagline)
      return (
        <RetailShell tenantId={tenant.id}>
          <RetailHeader tenant={theme} />
          <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-slate-800">
            <AboutCopy name={theme.name} />
          </main>
          <RetailFooter tenant={theme} />
        </RetailShell>
      )
    }
    default:
      notFound()
  }
}
