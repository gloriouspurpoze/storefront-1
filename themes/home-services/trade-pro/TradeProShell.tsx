'use client'

import type { ReactNode } from 'react'
import { EnquiryCartProvider } from '@/lib/enquiryCart'
import { TradeProCheckoutSticky } from './TradeProCheckoutSticky'
import { TradeProEnquiryDrawer } from './TradeProEnquiryDrawer'

/** Wraps trade-pro pages with enquiry cart state + drawer. */
export function TradeProShell({
  tenantId,
  children,
}: {
  tenantId: string
  children: ReactNode
}) {
  return (
    <EnquiryCartProvider tenantId={tenantId}>
      {children}
      <TradeProCheckoutSticky />
      <TradeProEnquiryDrawer tenantId={tenantId} />
    </EnquiryCartProvider>
  )
}
