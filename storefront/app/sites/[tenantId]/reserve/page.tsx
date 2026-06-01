import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { SiteHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter } from '@/themes/restaurant/SiteFooter'
import { ReservationForm } from '@/themes/restaurant/ReservationForm'
import { toThemeTenant } from '@/themes/restaurant/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadRestaurantTenant()
  return { title: 'Reservations', description: `Reserve a table at ${tenant.name}.` }
}

export default async function ReservePage() {
  const tenant = await loadRestaurantTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)

  return (
    <>
      <SiteHeader tenant={themeTenant} />
      <main className="mx-auto grid w-full max-w-5xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/80">
            Reservations
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-stone-900 sm:text-5xl">
            Book a table
          </h1>
          <p className="mt-4 text-stone-600">
            Share your preferred date and party size. Our team will confirm availability by email.
          </p>
        </div>
        <ReservationForm tenantId={tenant.id} />
      </main>
      <SiteFooter tenant={themeTenant} />
    </>
  )
}
