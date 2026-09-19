'use client'

import type { ReactNode } from 'react'
import { EnquiryCartProvider } from '@/lib/enquiryCart'
import { TradeProCheckoutSticky } from './TradeProCheckoutSticky'
import { TradeProEnquiryDrawer } from './TradeProEnquiryDrawer'
// Belt-and-suspenders: keep CSS in the client shell graph for soft navigations.
import './trade-pro.css'
import '../home-services-shell.css'

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
