import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ThemedAccountShell } from '@/components/account/themes/ThemedAccountShell'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { TrackOrderClient } from '@/themes/retail/TrackOrderClient'
import { toThemeTenant } from '@/themes/retail/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadTenantFromRequest()
  return {
    title: 'Track order',
    description: tenant ? `Track your order at ${tenant.name}.` : 'Track your order',
  }
}

export default async function TrackOrderPage() {
  const tenant = await loadTenantFromRequest()
  if (!tenant) notFound()

  const config = await fetchStorefrontConfig(tenant.id)
  const branding = config?.branding ?? {}
  const siteName = branding.siteName || tenant.name
  const themeTenant = toThemeTenant(tenant, branding.tagline ?? tenant.name)

  return (
    <ThemedAccountShell
      themeKey={config?.themeKey}
      tenantName={siteName}
      logoUrl={branding.logoUrl}
      tagline={branding.tagline}
    >
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <TrackOrderClient tenant={themeTenant} />
      </Suspense>
    </ThemedAccountShell>
  )
}
