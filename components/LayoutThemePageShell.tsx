'use client'

import type { ReactNode } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { StandardStorefrontNav } from '@/components/StandardStorefrontNav'
import { CartDrawer } from '@/components/commerce/CartDrawer'
import { useCartDrawerState } from '@/components/commerce/cartDrawerBus'
import { useCart as useRetailCart } from '@/themes/retail/cart'
import { useCart as useRestaurantCart } from '@/themes/restaurant/cart'

function RetailLayoutNav({
  config,
  siteName,
  tagline,
  tenantLogoUrl,
  wide,
  showShippingPolicy,
  navLinks,
}: {
  config: StorefrontConfig | null
  siteName: string
  tagline?: string
  tenantLogoUrl?: string | null
  wide?: boolean
  showShippingPolicy?: boolean
  navLinks?: { href: string; label: string }[]
}) {
  const { itemCount, lines, subtotal, setQuantity, removeLine } = useRetailCart()
  const [drawerOpen, setDrawerOpen] = useCartDrawerState()
  return (
    <>
      <StandardStorefrontNav
        tenant={{
          name: siteName,
          logoUrl: tenantLogoUrl ?? config?.branding?.logoUrl,
          brand: config?.branding?.primaryColor,
        }}
        config={config}
        itemCount={itemCount}
        variant="retail"
        onCartClick={() => setDrawerOpen(true)}
        showShippingPolicy={showShippingPolicy}
        accountMode="profile"
        className={wide ? 'sf-standard-nav--wide' : undefined}
        navLinks={navLinks}
      />
      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lines={lines}
        subtotal={subtotal}
        setQuantity={setQuantity}
        removeLine={removeLine}
        cartHref="/cart"
        productHref={(l) => (l.slug ? `/products/${l.slug}` : undefined)}
      />
    </>
  )
}

function RestaurantLayoutNav({
  config,
  siteName,
  tagline,
  tenantLogoUrl,
  wide,
  showShippingPolicy,
  navLinks,
}: {
  config: StorefrontConfig | null
  siteName: string
  tagline?: string
  tenantLogoUrl?: string | null
  wide?: boolean
  showShippingPolicy?: boolean
  navLinks?: { href: string; label: string }[]
}) {
  const { itemCount, lines, subtotal, setQuantity, removeLine } = useRestaurantCart()
  const [drawerOpen, setDrawerOpen] = useCartDrawerState()
  return (
    <>
      <StandardStorefrontNav
        tenant={{
          name: siteName,
          logoUrl: tenantLogoUrl ?? config?.branding?.logoUrl,
          brand: config?.branding?.primaryColor,
        }}
        config={config}
        itemCount={itemCount}
        variant="restaurant"
        onCartClick={() => setDrawerOpen(true)}
        showShippingPolicy={showShippingPolicy}
        accountMode="profile"
        className={wide ? 'sf-standard-nav--wide' : undefined}
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

export function LayoutThemePageShell({
  config,
  siteName,
  tagline,
  tenantLogoUrl,
  children,
  wide,
  showShippingPolicy = true,
  variant = 'retail',
  navLinks,
}: {
  config: StorefrontConfig | null
  siteName: string
  tagline?: string
  tenantLogoUrl?: string | null
  children: ReactNode
  wide?: boolean
  showShippingPolicy?: boolean
  variant?: 'retail' | 'restaurant'
  /** CMS header menu links for the shared drawer. */
  navLinks?: { href: string; label: string }[]
}) {
  const Nav = variant === 'restaurant' ? RestaurantLayoutNav : RetailLayoutNav

  return (
    <>
        <Nav
          config={config}
          siteName={siteName}
          tagline={tagline}
          tenantLogoUrl={tenantLogoUrl}
          wide={wide}
          showShippingPolicy={showShippingPolicy}
          navLinks={navLinks}
        />
        {children}
    </>
  )
}
