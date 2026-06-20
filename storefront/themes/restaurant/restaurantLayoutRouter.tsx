import type { PublicMenuCategory, PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from './types'
import { SaffronLayout, SaffronMenuPage } from './saffron'
import { MenuFastMinimalPage, MenuFastCardsPage } from './menufast'
import { isPrivateLayoutTheme, renderPrivateLayout } from '@/themes/private/registry'

/** Full-page restaurant layout templates (themeKey → React bundle). */
export function RestaurantLayoutPage({
  themeKey,
  menu,
  products,
  tenant,
  config,
}: {
  themeKey?: string
  menu: PublicMenuCategory[]
  products?: PublicProduct[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
}) {
  if (isPrivateLayoutTheme(themeKey)) {
    return renderPrivateLayout({ themeKey: themeKey!, menu, products, tenant, config }, 'restaurant')
  }

  switch (themeKey) {
    case 'saffron':
      return (
        <SaffronLayout>
          <SaffronMenuPage initialCategories={menu} tenant={tenant} config={config} />
        </SaffronLayout>
      )
    case 'menufast-minimal':
      return <MenuFastMinimalPage initialCategories={menu} tenant={tenant} config={config} />
    case 'menufast-cards':
      return <MenuFastCardsPage initialCategories={menu} tenant={tenant} config={config} />
    default:
      return null
  }
}

export const RESTAURANT_LAYOUT_THEME_KEYS = ['saffron', 'menufast-minimal', 'menufast-cards'] as const

export function isRestaurantLayoutTheme(themeKey?: string): boolean {
  if (isPrivateLayoutTheme(themeKey)) return true
  return RESTAURANT_LAYOUT_THEME_KEYS.includes(themeKey as (typeof RESTAURANT_LAYOUT_THEME_KEYS)[number])
}
