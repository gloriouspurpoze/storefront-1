'use client'

import type { StorefrontConfig } from '@/lib/storefront-api'
import { AccountThemeProvider } from '@/components/account/AccountThemeContext'
import { MenuOrderCheckoutBlock } from '../MenuOrderCheckoutBlock'
import type { ThemeTenant } from '../types'

export function MenuFastCardsCheckout({
  tenant,
  config,
  lines,
  showPreferredDate,
  onClear,
  onSuccess,
  primaryLabel,
}: {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  lines: Array<{ productId: string; quantity: number; variantId?: string }>
  showPreferredDate?: boolean
  onClear: () => void
  onSuccess: (orderNumber: string) => void
  primaryLabel?: string
}) {
  return (
    <AccountThemeProvider themeKey="menufast-cards">
      <MenuOrderCheckoutBlock
        tenant={tenant}
        config={config}
        lines={lines}
        showPreferredDate={showPreferredDate}
        onClear={onClear}
        onSuccess={onSuccess}
        primaryLabel={primaryLabel}
        appearance="menufast-cards"
        authReturnPath="/"
      />
    </AccountThemeProvider>
  )
}
