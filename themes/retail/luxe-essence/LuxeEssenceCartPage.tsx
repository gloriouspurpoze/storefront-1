'use client'

import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig, StorefrontProductCategory } from '@/lib/storefront-api'
import { CartClient } from '../CartClient'
import type { ThemeTenant } from '../types'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'

export function LuxeEssenceCartPage({
  tenant,
  config,
  navLinks,
  footerLinks,
  categories = [],
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
  categories?: StorefrontProductCategory[]
}) {
  return (
    <LuxeEssenceLayoutPage
      tenant={tenant}
      config={config}
      navLinks={navLinks}
      footerLinks={footerLinks}
      categories={categories}
    >
      <h1 className="sf-page-title">Your cart</h1>
      <div className="sf-page-body">
        <CartClient themeKey="luxe-essence" />
      </div>
    </LuxeEssenceLayoutPage>
  )
}
