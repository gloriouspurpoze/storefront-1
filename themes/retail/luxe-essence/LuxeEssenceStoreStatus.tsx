'use client'

import type { StorefrontConfig } from '@/lib/storefront-api'
import { StoreStatusBadge, StoreStatusCard } from '@/components/StoreStatusBadge'

/** Header store hours badge — desktop center slot. */
export function LuxeEssenceHeaderStoreStatus({ config }: { config: StorefrontConfig | null }) {
  return <StoreStatusBadge config={config} className="le-header-status" />
}

/** Hero store status card — always visible (mobile + desktop). */
export function LuxeEssenceHeroStoreStatus({ config }: { config: StorefrontConfig | null }) {
  return <StoreStatusCard config={config} className="le-hero-status" />
}
