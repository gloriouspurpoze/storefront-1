import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { AccountShell } from '@/components/account/AccountShell'
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
    <AccountShell tenantName={siteName} logoUrl={branding.logoUrl}>
      {children}
    </AccountShell>
  )
}
