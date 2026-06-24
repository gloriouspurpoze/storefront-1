import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { ThemedAccountShell } from '@/components/account/themes/ThemedAccountShell'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { loadTenantFromRequest } from '@/lib/load-tenant'

export const dynamic = 'force-dynamic'

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const tenant = await loadTenantFromRequest()
  if (!tenant) notFound()

  const config = await fetchStorefrontConfig(tenant.id)
  const branding = config?.branding ?? {}
  const siteName = branding.siteName || tenant.name

  return (
    <ThemedAccountShell
      themeKey={config?.themeKey}
      tenantName={siteName}
      logoUrl={branding.logoUrl}
      tagline={branding.tagline}
    >
      {children}
    </ThemedAccountShell>
  )
}
