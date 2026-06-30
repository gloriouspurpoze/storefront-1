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
}: {
  config: StorefrontConfig | null
  siteName: string
  tagline?: string
  tenantLogoUrl?: string | null
  wide?: boolean
  showShippingPolicy?: boolean
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
      cartHref="/checkout"
      showShippingPolicy={showShippingPolicy}
      accountMode="profile"
      className={wide ? 'sf-standard-nav--wide' : undefined}
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
}: {
  config: StorefrontConfig | null
  siteName: string
  tagline?: string
  tenantLogoUrl?: string | null
  wide?: boolean
  showShippingPolicy?: boolean
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
      cartHref="/checkout"
      showShippingPolicy={showShippingPolicy}
      accountMode="profile"
      className={wide ? 'sf-standard-nav--wide' : undefined}
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
}: {
  config: StorefrontConfig | null
  siteName: string
  tagline?: string
  tenantLogoUrl?: string | null
  children: ReactNode
  wide?: boolean
  showShippingPolicy?: boolean
  variant?: 'retail' | 'restaurant'
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
      />
      {children}
    </>
  )
}
