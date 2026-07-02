'use client'

import type { StorefrontConfig } from '@/lib/storefront-api'
import { StoreStatusBadge } from '@/components/StoreStatusBadge'

/** Store open/closed badge styled for the dark cards menu header. */
export function MenuFastCardsStoreStatus({ config }: { config: StorefrontConfig | null }) {
  return <StoreStatusBadge config={config} compact className="mf-cards-store-status" />
}
