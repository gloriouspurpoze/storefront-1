import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant } from '@/themes/retail/types'
import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'
import {
  ShippingPolicyPageContent,
  ShippingPolicyPageShell,
} from '@/components/ShippingPolicyPageContent'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadTenantFromRequest()
  return {
    title: 'Shipping policy',
    description: tenant ? `Shipping and delivery information for ${tenant.name}` : 'Shipping policy',
  }
}

export default async function ShippingPolicyPage() {
  const resolved = await loadTenantFromRequest()
  if (!resolved) notFound()

  if (resolved.verticalKey !== 'retail') notFound()

  const tenant = await loadRetailTenant()
  const config = await fetchStorefrontConfig(tenant.id)
  const branding = config?.branding ?? {}
  const siteName = branding.siteName || tenant.name
  const theme = toThemeTenant(tenant, branding.tagline ?? '')

  const content = <ShippingPolicyPageContent config={config} siteName={siteName} variant="retail" />

  if (isRetailLayoutTheme(config?.themeKey)) {
    return (
      <RetailShell tenantId={tenant.id}>
        <div className="min-h-screen bg-[#faf9fc]">
          <ShippingPolicyPageShell tenant={theme} config={config} variant="retail">
            {content}
          </ShippingPolicyPageShell>
        </div>
      </RetailShell>
    )
  }

  return (
    <RetailShell tenantId={tenant.id}>
      <ShippingPolicyPageShell tenant={theme} config={config} variant="retail">
        {content}
      </ShippingPolicyPageShell>
      <SiteFooter tenant={theme} />
    </RetailShell>
  )
}
