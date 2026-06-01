import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { CheckoutClient } from '@/themes/retail/CheckoutClient'
import { toThemeTenant } from '@/themes/retail/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadRetailTenant()
  return { title: 'Checkout', description: `Checkout at ${tenant.name}.` }
}

export default async function CheckoutPage() {
  const tenant = await loadRetailTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)

  return (
    <RetailShell tenantId={tenant.id}>
      <SiteHeader tenant={themeTenant} />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
        <div className="mt-8">
          <CheckoutClient tenant={themeTenant} />
        </div>
      </main>
      <SiteFooter tenant={themeTenant} />
    </RetailShell>
  )
}
