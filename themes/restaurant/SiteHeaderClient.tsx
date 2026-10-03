'use client'

import type { StorefrontConfig } from '@/lib/storefront-api'
import { StandardStorefrontNav } from '@/components/StandardStorefrontNav'
import { CartDrawer } from '@/components/commerce/CartDrawer'
import { useCartDrawerState } from '@/components/commerce/cartDrawerBus'
import type { ThemeTenant } from './types'
import { useCart } from './cart'

export function SiteHeaderClient({
  tenant,
  config,
  navLinks,
}: {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  navLinks?: { href: string; label: string }[]
}) {
  const { itemCount, lines, subtotal, setQuantity, removeLine } = useCart()
  const [drawerOpen, setDrawerOpen] = useCartDrawerState()

  return (
    <>
      <StandardStorefrontNav
        tenant={tenant}
        config={config}
        itemCount={itemCount}
        variant="restaurant"
        onCartClick={() => setDrawerOpen(true)}
        showShippingPolicy
        navLinks={navLinks}
      />
      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lines={lines}
        subtotal={subtotal}
        setQuantity={setQuantity}
        removeLine={removeLine}
        checkoutHref="/checkout"
        continueLabel="Browse the menu"
        continueHref="/menu"
        note="Delivery fee and taxes calculated at checkout."
      />
    </>
  )
}
