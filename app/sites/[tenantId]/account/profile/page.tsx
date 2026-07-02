import { loadTenantFromRequest } from '@/lib/load-tenant'
import { AccountProfilePanel } from '@/components/account/AccountProfilePanel'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadTenantFromRequest()
  return {
    title: 'Profile',
    description: tenant ? `Your profile at ${tenant.name}` : 'Your profile',
  }
}

export default async function AccountProfilePage() {
  const tenant = await loadTenantFromRequest()
  if (!tenant) return null

  return <AccountProfilePanel tenantId={tenant.id} />
}
