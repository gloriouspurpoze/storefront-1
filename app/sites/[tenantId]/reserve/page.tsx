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
      <main className="sf-container grid gap-12 py-16 lg:grid-cols-2">
        <div>
          <p className="sf-page-eyebrow">
            Reservations
          </p>
          <h1 className="sf-page-title">
            Book a table
          </h1>
          <p className="sf-page-lead">
            Share your preferred date and party size. Our team will confirm availability by email.
          </p>
        </div>
        <ReservationForm tenantId={tenant.id} />
      </main>
      <SiteFooter tenant={themeTenant} />
    </RestaurantShell>
  )
}
