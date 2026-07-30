import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'
import { SiteHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter } from '@/themes/restaurant/SiteFooter'
import { ReservationForm } from '@/themes/restaurant/ReservationForm'
import { toThemeTenant } from '@/themes/restaurant/types'
import { storefrontPathMetadata } from '@/lib/path-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return storefrontPathMetadata('/reserve')
}

export default async function ReservePage() {
  const tenant = await loadRestaurantTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)

  return (
    <RestaurantShell tenantId={tenant.id}>
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
    </RestaurantShell>
  )
}
