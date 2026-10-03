'use client'

import { useCallback, useState, type CSSProperties } from 'react'
import { LiveChatWidget } from './LiveChatWidget'
import { WhatsAppFloatingButton } from './WhatsAppFloatingButton'
import { useBottomBarLift } from './useBottomBarLift'
import './storefront-floating-widgets.css'

/**
 * Bottom-left dock for paid floating add-ons (WhatsApp button, live chat).
 * Gating happens server-side in `app/sites/[tenantId]/layout.tsx`; this only renders what it is given.
 * Stack (bottom → top): live chat bubble, WhatsApp button.
 */
export function StorefrontFloatingWidgets({
  tenantId,
  siteName,
  whatsAppDigits,
  liveChat,
}: {
  tenantId: string
  siteName: string
  whatsAppDigits: string | null
  liveChat: boolean
}) {
  const lift = useBottomBarLift()
  const [chatOpen, setChatOpen] = useState(false)
  const onChatOpenChange = useCallback((open: boolean) => setChatOpen(open), [])

  if (!whatsAppDigits && !liveChat) return null

  return (
    <div
      className="sfw-dock"
      style={{ ['--sfw-lift' as never]: `${lift}px` } as CSSProperties}
      data-storefront-floating-dock=""
    >
      {liveChat ? <LiveChatWidget tenantId={tenantId} siteName={siteName} onOpenChange={onChatOpenChange} /> : null}
      {whatsAppDigits && !chatOpen ? <WhatsAppFloatingButton digits={whatsAppDigits} siteName={siteName} /> : null}
    </div>
  )
}
