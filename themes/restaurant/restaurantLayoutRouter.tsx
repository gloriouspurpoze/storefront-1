import type { StorefrontNavLink } from '@/lib/cms-content'
import type { PublicMenuCategory, PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from './types'
import { SaffronLayout, SaffronMenuPage } from './saffron'
import { MenuFastMinimalPage, MenuFastCardsStorefrontPage } from './menufast'
import { isPrivateLayoutTheme, renderPrivateLayout } from '@/themes/private/registry'

/** Full-page restaurant layout templates (themeKey → React bundle). */
export function RestaurantLayoutPage({
  themeKey,
  menu,
  products,
  tenant,
  config,
  navLinks,
  footerLinks,
}: {
  themeKey?: string
  menu: PublicMenuCategory[]
  products?: PublicProduct[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
  /** CMS header menu links (empty → theme hardcoded fallback). */
  navLinks?: StorefrontNavLink[]
  /** CMS footer menu links (empty → theme hardcoded fallback). */
  footerLinks?: StorefrontNavLink[]
}) {
  if (isPrivateLayoutTheme(themeKey)) {
    return renderPrivateLayout(
      { themeKey: themeKey!, menu, products, tenant, config, navLinks, footerLinks },
      'restaurant',
    )
  }

  switch (themeKey) {
    case 'saffron':
      return (
        <SaffronLayout>
          <SaffronMenuPage
            initialCategories={menu}
            tenant={tenant}
            config={config}
            navLinks={navLinks}
            footerLinks={footerLinks}
          />
        </SaffronLayout>
      )
    case 'menufast-minimal':
      return (
        <MenuFastMinimalPage
          initialCategories={menu}
          tenant={tenant}
          config={config}
          navLinks={navLinks}
          footerLinks={footerLinks}
        />
      )
    case 'menufast-cards':
      return (
        <MenuFastCardsStorefrontPage
          initialCategories={menu}
          tenant={tenant}
          config={config}
          navLinks={navLinks}
          footerLinks={footerLinks}
        />
      )
    default:
      return null
  }
}

export const RESTAURANT_LAYOUT_THEME_KEYS = ['saffron', 'menufast-minimal', 'menufast-cards'] as const

export function isRestaurantLayoutTheme(themeKey?: string): boolean {
  if (isPrivateLayoutTheme(themeKey)) return true
  return RESTAURANT_LAYOUT_THEME_KEYS.includes(themeKey as (typeof RESTAURANT_LAYOUT_THEME_KEYS)[number])
}
