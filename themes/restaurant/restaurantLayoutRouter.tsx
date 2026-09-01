import type { StorefrontNavLink } from '@/lib/cms-content'
import type { PublicMenuCategory, PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from './types'
import { SaffronLayout, SaffronMenuPage } from './saffron'
import { MenuFastMinimalPage, MenuFastCardsStorefrontPage } from './menufast'
import { createLayoutRouter } from '@/theme-kit/layout'

type RestaurantLayoutProps = {
  menu: PublicMenuCategory[]
  products?: PublicProduct[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
  /** CMS header menu links (empty → theme hardcoded fallback). */
  navLinks?: StorefrontNavLink[]
  /** CMS footer menu links (empty → theme hardcoded fallback). */
  footerLinks?: StorefrontNavLink[]
}

const router = createLayoutRouter<RestaurantLayoutProps, 'saffron' | 'menufast-minimal' | 'menufast-cards'>({
  vertical: 'restaurant',
  themeKeys: ['saffron', 'menufast-minimal', 'menufast-cards'],
  cases: {
    saffron: (p) => (
      <SaffronLayout>
        <SaffronMenuPage
          initialCategories={p.menu}
          tenant={p.tenant}
          config={p.config}
          navLinks={p.navLinks}
          footerLinks={p.footerLinks}
        />
      </SaffronLayout>
    ),
    'menufast-minimal': (p) => (
      <MenuFastMinimalPage
        initialCategories={p.menu}
        tenant={p.tenant}
        config={p.config}
        navLinks={p.navLinks}
        footerLinks={p.footerLinks}
      />
    ),
    'menufast-cards': (p) => (
      <MenuFastCardsStorefrontPage
        initialCategories={p.menu}
        tenant={p.tenant}
        config={p.config}
        navLinks={p.navLinks}
        footerLinks={p.footerLinks}
      />
    ),
  },
})

/** Full-page restaurant layout templates (themeKey → React bundle). */
export const RestaurantLayoutPage = router.LayoutPage
export const RESTAURANT_LAYOUT_THEME_KEYS = router.themeKeys
export const isRestaurantLayoutTheme = router.isLayoutTheme
