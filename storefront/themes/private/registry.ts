import { createElement, type ComponentType, type ReactNode } from 'react'
import type { PublicMenuCategory, PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant as RetailThemeTenant } from '@/themes/retail/types'
import type { ThemeTenant as RestaurantThemeTenant } from '@/themes/restaurant/types'
import type { ThemeTenant as HomeServicesThemeTenant } from '@/themes/home-services/types'
import { BrownButterPage } from './thebrownbutter/BrownButterPage'

export type PrivateVerticalKey = 'home_services' | 'restaurant' | 'retail'

export type PrivateLayoutRenderArgs = {
  themeKey: string
  tenant: RetailThemeTenant | RestaurantThemeTenant | HomeServicesThemeTenant
  config: StorefrontConfig | null
  products?: PublicProduct[]
  menu?: PublicMenuCategory[]
}

type PrivateLayoutComponentProps = Pick<PrivateLayoutRenderArgs, 'tenant' | 'config' | 'products' | 'menu'>

export type PrivateLayoutEntry = {
  vertical: PrivateVerticalKey
  Component: ComponentType<PrivateLayoutComponentProps>
}

export const PRIVATE_LAYOUT_REGISTRY: Record<string, PrivateLayoutEntry> = {
  'private-thebrownbutter': {
    vertical: 'restaurant',
    Component: BrownButterPage,
  },
}

export function isPrivateLayoutTheme(themeKey?: string): boolean {
  return Boolean(themeKey && themeKey in PRIVATE_LAYOUT_REGISTRY)
}

export function privateLayoutVertical(themeKey?: string): PrivateVerticalKey | null {
  if (!themeKey) return null
  return PRIVATE_LAYOUT_REGISTRY[themeKey]?.vertical ?? null
}

export function renderPrivateLayout(
  args: PrivateLayoutRenderArgs,
  expectedVertical?: PrivateVerticalKey,
): ReactNode | null {
  const entry = PRIVATE_LAYOUT_REGISTRY[args.themeKey]
  if (!entry) return null
  if (expectedVertical && entry.vertical !== expectedVertical) return null
  return createElement(entry.Component, {
    tenant: args.tenant,
    config: args.config,
    products: args.products,
    menu: args.menu,
  })
}
