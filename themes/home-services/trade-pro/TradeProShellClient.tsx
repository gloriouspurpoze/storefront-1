'use client'

import type { ReactNode } from 'react'
import { TradeProShell } from './TradeProShell'

/** Client boundary so RSC pages can wrap trade-pro chrome in the enquiry cart. */
export function TradeProShellClient({
  tenantId,
  children,
}: {
  tenantId: string
  children: ReactNode
}) {
  return <TradeProShell tenantId={tenantId}>{children}</TradeProShell>
}
