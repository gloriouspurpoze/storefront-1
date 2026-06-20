'use client'

import type { ReactNode } from 'react'
import { CartProvider } from './cart'

export function RestaurantShell({
  tenantId,
  children,
}: {
  tenantId: string
  children: ReactNode
}) {
  return <CartProvider tenantId={tenantId}>{children}</CartProvider>
}
