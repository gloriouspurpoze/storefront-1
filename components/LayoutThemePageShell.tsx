'use client'

import type { ReactNode } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { StandardStorefrontNav } from '@/components/StandardStorefrontNav'
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
  const { itemCount } = useRetailCart()
  return (
    <StandardStorefrontNav
      tenant={{
        name: siteName,
        logoUrl: tenantLogoUrl ?? config?.branding?.logoUrl,
        brand: config?.branding?.primaryColor,
      }}
      config={config}
      itemCount={itemCount}
      variant="retail"
      cartHref="/cart"
      showShippingPolicy={showShippingPolicy}
      accountMode="profile"
      className={wide ? 'sf-standard-nav--wide' : undefined}
      navLinks={navLinks}
    />
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
  const { itemCount } = useRestaurantCart()
  return (
    <StandardStorefrontNav
      tenant={{
        name: siteName,
        logoUrl: tenantLogoUrl ?? config?.branding?.logoUrl,
        brand: config?.branding?.primaryColor,
      }}
      config={config}
      itemCount={itemCount}
      variant="restaurant"
      cartHref="/cart"
      showShippingPolicy={showShippingPolicy}
      accountMode="profile"
      className={wide ? 'sf-standard-nav--wide' : undefined}
      navLinks={navLinks}
    />
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
