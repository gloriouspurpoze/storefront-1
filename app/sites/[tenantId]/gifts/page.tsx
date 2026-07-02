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
      <main className="sf-page-shell sf-page-shell--medium">
        <p className="sf-page-eyebrow">Gift match</p>
        <h1 className="sf-page-title">Gifts they&apos;ll love</h1>
        <p className="sf-page-lead">
          Answer a few quick questions and we&apos;ll suggest handcrafted picks from our catalog.
        </p>
        <div className="sf-page-body sf-page-body--tight">
          <GiftMatchWidget tenantId={tenant.id} />
        </div>
      </main>
      <SiteFooter tenant={theme} />
    </RetailShell>
  )
}
