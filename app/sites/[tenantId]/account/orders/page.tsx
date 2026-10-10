import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { OrderHistory } from '@/components/account/OrderHistory'
import { MarketplaceOrdersClient } from '@/themes/marketplace/MarketplaceOrdersClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadTenantFromRequest()
  const config = tenant ? await fetchStorefrontConfig(tenant.id) : null
  const isTradePro = config?.themeKey === 'trade-pro'
  const isBrownButter = config?.themeKey === 'private-thebrownbutter'
  return {
    title: isTradePro
      ? 'Your enquiries'
      : isBrownButter
        ? 'Orders & enquiries'
        : 'Your orders',
    description: tenant
      ? isTradePro
        ? `Enquiries and booking status at ${tenant.name}`
        : isBrownButter
          ? `Orders and shipping enquiries at ${tenant.name}`
          : `Order history at ${tenant.name}`
      : isTradePro
        ? 'Enquiry history'
        : isBrownButter
          ? 'Orders and enquiries'
          : 'Order history',
  }
}

export default async function AccountOrdersPage() {
  const tenant = await loadTenantFromRequest()
  if (!tenant) return null
  // Marketplace orders are split checkouts (one parcel per seller) — not single-store orders.
  if (tenant.verticalKey === 'marketplace') return <MarketplaceOrdersClient tenantId={tenant.id} />

  return <OrderHistory tenantId={tenant.id} />
}
