'use client'

import { StorefrontMenuDrawer } from '@/components/StorefrontMenuDrawer'
import type { ComponentProps } from 'react'

type MenuDrawerProps = ComponentProps<typeof StorefrontMenuDrawer>

/** Cards-themed site menu drawer (ordering hours + delivery policy). */
export function MenuFastCardsMenuDrawer(props: Omit<MenuDrawerProps, 'drawerId'>) {
  return <StorefrontMenuDrawer {...props} drawerId="storefront-menu-drawer" />
}
