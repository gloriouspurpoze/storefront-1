import { loadTenantFromRequest } from '@/lib/load-tenant'
import { OrderHistory } from '@/components/account/OrderHistory'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadTenantFromRequest()
  return {
    title: 'Your orders',
    description: tenant ? `Order history at ${tenant.name}` : 'Order history',
  }
}

export default async function AccountDashboardPage() {
  const tenant = await loadTenantFromRequest()
  if (!tenant) return null

  return <OrderHistory tenantId={tenant.id} />
}
