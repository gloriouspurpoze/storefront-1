import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { TrackOrderClient } from '@/themes/retail/TrackOrderClient'
import { toThemeTenant } from '@/themes/retail/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadRetailTenant()
  return { title: 'Track order', description: `Track your order at ${tenant.name}.` }
}

export default async function TrackOrderPage() {
  const tenant = await loadRetailTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)

  return (
    <RetailShell tenantId={tenant.id}>
      <SiteHeader tenant={themeTenant} />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold text-slate-900">Track your order</h1>
        <p className="mt-2 text-slate-600">See delivery status and carrier tracking for your purchase.</p>
        <div className="mt-8">
          <TrackOrderClient tenant={themeTenant} />
        </div>
      </main>
      <SiteFooter tenant={themeTenant} />
    </RetailShell>
  )
}
