'use client'

import type { StorefrontConfig, StorefrontProductCategory } from '@/lib/storefront-api'
import { StandardStorefrontNav } from '@/components/StandardStorefrontNav'
import { CartDrawer } from '@/components/commerce/CartDrawer'
import { useCartDrawerState } from '@/components/commerce/cartDrawerBus'
import type { ThemeTenant } from './types'
import { useCart } from './cart'

export function SiteHeaderClient({
  tenant,
  config,
  navLinks,
  categories,
}: {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  navLinks?: { href: string; label: string }[]
  categories?: StorefrontProductCategory[]
}) {
  const { itemCount, lines, subtotal, setQuantity, removeLine } = useCart()
  const [drawerOpen, setDrawerOpen] = useCartDrawerState()

  return (
    <>
      <StandardStorefrontNav
        tenant={tenant}
        config={config}
        itemCount={itemCount}
        variant="retail"
        onCartClick={() => setDrawerOpen(true)}
        navLinks={navLinks}
        categories={categories}
      />
      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lines={lines}
        subtotal={subtotal}
        setQuantity={setQuantity}
        removeLine={removeLine}
        checkoutHref="/checkout"
        cartHref="/cart"
        productHref={(l) => (l.slug ? `/products/${l.slug}` : undefined)}
      />
    </>
  )
}
