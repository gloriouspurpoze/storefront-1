'use client'

import { StorefrontMenuDrawer, type StorefrontMenuNavLink } from '@/components/StorefrontMenuDrawer'
import type { ComponentProps } from 'react'

/** Content + account links for Cards phone shell. */
const CARDS_DRAWER_NAV: StorefrontMenuNavLink[] = [
  { href: '/', label: 'Menu' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
  { href: '/account', label: 'My orders' },
  { href: '/orders/track', label: 'Track order' },
]

type MenuDrawerProps = ComponentProps<typeof StorefrontMenuDrawer>

/** Cards-themed site menu drawer (ordering hours + delivery policy). */
export function MenuFastCardsMenuDrawer({
  navLinks,
  ...props
}: Omit<MenuDrawerProps, 'drawerId'>) {
  return (
    <StorefrontMenuDrawer
      {...props}
      drawerId="storefront-menu-drawer"
      navLinks={navLinks?.length ? navLinks : CARDS_DRAWER_NAV}
    />
  )
}
