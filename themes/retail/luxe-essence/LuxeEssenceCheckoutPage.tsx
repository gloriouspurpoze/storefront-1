'use client'

import type { StorefrontConfig } from '@/lib/storefront-api'
import { CheckoutClient } from '../CheckoutClient'
import type { ThemeTenant } from '../types'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'

export function LuxeEssenceCheckoutPage({
  tenant,
  config,
  showPreferredDate,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  showPreferredDate?: boolean
}) {
  return (
    <LuxeEssenceLayoutPage tenant={tenant} config={config}>
      <h1 className="sf-page-title">Checkout</h1>
      <div className="sf-page-body">
        <CheckoutClient
          tenant={tenant}
          config={config}
          showPreferredDate={showPreferredDate}
          themeKey="luxe-essence"
        />
      </div>
    </LuxeEssenceLayoutPage>
  )
}
