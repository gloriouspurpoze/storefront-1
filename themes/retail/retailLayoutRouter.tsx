import type { StorefrontNavLink } from '@/lib/cms-content'
import type { PublicProduct, StorefrontConfig, StorefrontProductCategory } from '@/lib/storefront-api'
import type { ThemeTenant } from './types'
import { RetailShell } from './RetailShell'
import { SoftStudioPage } from './soft-studio'
import { LuxeEssenceStorefrontPage } from './luxe-essence'
import { createLayoutRouter } from '@/theme-kit/layout'

type RetailLayoutProps = {
  products: PublicProduct[]
  categories?: StorefrontProductCategory[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
  /** CMS header menu links (empty → theme hardcoded fallback). */
  navLinks?: StorefrontNavLink[]
  /** CMS footer menu links (empty → theme hardcoded fallback). */
  footerLinks?: StorefrontNavLink[]
}

const router = createLayoutRouter<RetailLayoutProps, 'soft-studio' | 'luxe-essence'>({
  vertical: 'retail',
  themeKeys: ['soft-studio', 'luxe-essence'],
  cases: {
    'soft-studio': (p) => (
      <RetailShell tenantId={p.tenant.id}>
        <SoftStudioPage
          products={p.products}
          tenant={p.tenant}
          config={p.config}
          navLinks={p.navLinks}
          footerLinks={p.footerLinks}
        />
      </RetailShell>
    ),
    'luxe-essence': (p) => (
      <RetailShell tenantId={p.tenant.id}>
        <LuxeEssenceStorefrontPage
          products={p.products}
          categories={p.categories}
          tenant={p.tenant}
          config={p.config}
          navLinks={p.navLinks}
          footerLinks={p.footerLinks}
        />
      </RetailShell>
    ),
  },
})

/** Full-page retail / e-commerce layout templates (themeKey → React bundle). */
export const RetailLayoutPage = router.LayoutPage
export const RETAIL_LAYOUT_THEME_KEYS = router.themeKeys
export const isRetailLayoutTheme = router.isLayoutTheme
