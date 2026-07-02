import { notFound } from 'next/navigation'
import { GiftMatchWidget } from '@/components/GiftMatchWidget'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant } from '@/themes/retail/types'

export const dynamic = 'force-dynamic'

export default async function GiftsPage() {
  const resolved = await loadTenantFromRequest()
  if (!resolved) notFound()

  if (resolved.verticalKey !== 'retail') {
    notFound()
  }

  const tenant = await loadRetailTenant()
  const theme = toThemeTenant(tenant, tenant.fallbackTagline)
  const cfg = await fetchStorefrontConfig(tenant.id)

  return (
    <RetailShell tenantId={tenant.id}>
      <SiteHeader tenant={theme} config={cfg} />
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Gift match</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Gifts they&apos;ll love</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Answer a few quick questions and we&apos;ll suggest handcrafted picks from our catalog.
        </p>
        <GiftMatchWidget tenantId={tenant.id} className="mt-10" />
      </main>
      <SiteFooter tenant={theme} config={cfg} />
    </RetailShell>
  )
}
