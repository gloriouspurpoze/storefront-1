'use client'

import { StorefrontMenuDrawer, type StorefrontMenuNavLink } from '@/components/StorefrontMenuDrawer'
import type { ComponentProps } from 'react'

/** Nav links aligned with LuxeEssenceFooter — no duplicate policy clutter. */
const LUXE_DRAWER_NAV: StorefrontMenuNavLink[] = [
  { href: '#products', label: 'Featured' },
  { href: '/products', label: 'All products' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
  { href: '/account', label: 'My orders' },
  { href: '/orders/track', label: 'Track order' },
  { href: '/account/login', label: 'Sign in' },
  { href: '/account/login?signup=1', label: 'Sign up' },
]

type MenuDrawerProps = Omit<ComponentProps<typeof StorefrontMenuDrawer>, 'drawerId' | 'navLinks'>

/** Luxe Essence mobile nav — site links + ordering hours / shipping policy. */
export function LuxeEssenceMenuDrawer(props: MenuDrawerProps) {
  return (
    <StorefrontMenuDrawer
      {...props}
      drawerId="storefront-menu-drawer"
      navLinks={LUXE_DRAWER_NAV}
      shippingPolicyLabel="Shipping policy"
    />
  )
}
