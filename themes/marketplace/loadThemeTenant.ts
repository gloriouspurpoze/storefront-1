import { loadVerticalTenant } from '@/theme-kit/tenant'
import { loadTenantFromRequest } from '@/lib/load-tenant'

/** 404s unless the host's tenant is on the `marketplace` vertical. */
export function loadMarketplaceTenant(fallbackTagline = 'Independent makers, one marketplace.') {
  return loadVerticalTenant('marketplace', fallbackTagline)
}

/**
 * Shared routes (`/products`, `/cart`, …) branch on this before their own vertical loader:
 * the marketplace tenant, or null for every other vertical (no 404).
 */
export async function marketplaceTenantOrNull() {
  const tenant = await loadTenantFromRequest()
  return tenant?.verticalKey === 'marketplace' ? tenant : null
}
