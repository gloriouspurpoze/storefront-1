'use client'

import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { CartClient } from '../CartClient'
import type { ThemeTenant } from '../types'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'

export function LuxeEssenceCartPage({
  tenant,
  config,
  navLinks,
  footerLinks,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
}) {
  return (
    <LuxeEssenceLayoutPage
      tenant={tenant}
      config={config}
      navLinks={navLinks}
      footerLinks={footerLinks}
    >
      <h1 className="sf-page-title">Your cart</h1>
      <div className="sf-page-body">
        <CartClient themeKey="luxe-essence" />
      </div>
    </LuxeEssenceLayoutPage>
  )
}
