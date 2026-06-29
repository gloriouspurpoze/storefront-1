'use client'

import type { StorefrontConfig } from '@/lib/storefront-api'
import { StandardStorefrontNav } from '@/components/StandardStorefrontNav'
import type { ThemeTenant } from './types'
import { useCart } from './cart'

export function SiteHeader({
  tenant,
  config,
}: {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
}) {
  const { itemCount } = useCart()

  return (
    <StandardStorefrontNav
      tenant={tenant}
      config={config}
      itemCount={itemCount}
      variant="restaurant"
      cartHref="/checkout"
      showShippingPolicy
    />
  )
}
