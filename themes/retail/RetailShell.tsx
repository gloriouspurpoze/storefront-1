'use client'

import type { ReactNode } from 'react'
import { CartProvider } from './cart'

/** Wraps retail pages with cart state (localStorage per tenant). */
export function RetailShell({
  tenantId,
  children,
}: {
  tenantId: string
  children: ReactNode
}) {
  return <CartProvider tenantId={tenantId}>{children}</CartProvider>
}
