import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { OrderHistory } from '@/components/account/OrderHistory'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadTenantFromRequest()
  const config = tenant ? await fetchStorefrontConfig(tenant.id) : null
  const isTradePro = config?.themeKey === 'trade-pro'
  return {
    title: isTradePro ? 'Your enquiries' : 'Your orders',
    description: tenant
      ? isTradePro
        ? `Enquiries and booking status at ${tenant.name}`
        : `Order history at ${tenant.name}`
      : isTradePro
        ? 'Enquiry history'
        : 'Order history',
  }
}

export default async function AccountOrdersPage() {
  const tenant = await loadTenantFromRequest()
  if (!tenant) return null

  return <OrderHistory tenantId={tenant.id} />
}
