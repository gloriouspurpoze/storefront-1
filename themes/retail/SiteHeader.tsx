'use client'

import type { StorefrontConfig } from '@/lib/storefront-api'
import { StandardStorefrontNav } from '@/components/StandardStorefrontNav'
import type { ThemeTenant } from './types'
import { useCart } from './cart'

export function SiteHeader({
  tenant,
  config,
  navLinks,
}: {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  navLinks?: { href: string; label: string }[]
}) {
  const { itemCount } = useCart()

  return (
    <StandardStorefrontNav
      tenant={tenant}
      config={config}
      itemCount={itemCount}
      variant="retail"
      cartHref="/cart"
      navLinks={navLinks}
    />
  )
}
