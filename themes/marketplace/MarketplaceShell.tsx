'use client'

import type { ReactNode } from 'react'
import { CartProvider } from './cart'

/** Wraps marketplace pages with the multi-seller cart (localStorage per tenant). */
export function MarketplaceShell({ tenantId, children }: { tenantId: string; children: ReactNode }) {
  return <CartProvider tenantId={tenantId}>{children}</CartProvider>
}
