'use client'

import type { StorefrontConfig } from '@/lib/storefront-api'
import { CartClient } from '../CartClient'
import type { ThemeTenant } from '../types'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'

export function LuxeEssenceCartPage({
  tenant,
  config,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
}) {
  return (
    <LuxeEssenceLayoutPage tenant={tenant} config={config}>
      <h1 className="sf-page-title">Your cart</h1>
      <div className="sf-page-body">
        <CartClient themeKey="luxe-essence" />
      </div>
    </LuxeEssenceLayoutPage>
  )
}
