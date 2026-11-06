import { permanentRedirect } from 'next/navigation'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { isBrownButterTheme } from '@/themes/private/thebrownbutter/brownButterNav'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'
import { SiteHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter } from '@/themes/restaurant/SiteFooter'
import { ReservationForm } from '@/themes/restaurant/ReservationForm'
import { toThemeTenant } from '@/themes/restaurant/types'
import { storefrontPathMetadata } from '@/lib/path-metadata'
import { seoOverridable } from '@/lib/tenant-seo'

export const dynamic = 'force-dynamic'

async function baseGenerateMetadata() {
  return storefrontPathMetadata('/reserve')
}

export default async function ReservePage() {
  const tenant = await loadRestaurantTenant()
  // Brown Butter takes no table bookings; the generic restaurant form here is off-brand and unlinked.
  const cfg = await fetchStorefrontConfig(tenant.id)
  if (isBrownButterTheme(cfg?.themeKey)) permanentRedirect('/')
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

export const generateMetadata = seoOverridable((p) => '/reserve', baseGenerateMetadata)
