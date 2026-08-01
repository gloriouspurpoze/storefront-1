import type { StorefrontNavLink } from '@/lib/cms-content'
import type { PublicProduct, StorefrontConfig, StorefrontProductCategory } from '@/lib/storefront-api'
import type { ThemeTenant } from './types'
import { RetailShell } from './RetailShell'
import { SoftStudioPage } from './soft-studio'
import { LuxeEssenceStorefrontPage } from './luxe-essence'
import { isPrivateLayoutTheme, renderPrivateLayout } from '@/themes/private/registry'

/** Full-page retail / e-commerce layout templates (themeKey → React bundle). */
export function RetailLayoutPage({
  themeKey,
  products,
  categories = [],
  tenant,
  config,
  navLinks,
  footerLinks,
}: {
  themeKey?: string
  products: PublicProduct[]
  categories?: StorefrontProductCategory[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
  /** CMS header menu links (empty → theme hardcoded fallback). */
  navLinks?: StorefrontNavLink[]
  /** CMS footer menu links (empty → theme hardcoded fallback). */
  footerLinks?: StorefrontNavLink[]
}) {
  if (isPrivateLayoutTheme(themeKey)) {
    return renderPrivateLayout(
      { themeKey: themeKey!, products, tenant, config, navLinks, footerLinks },
      'retail',
    )
  }

  switch (themeKey) {
    case 'soft-studio':
      return (
        <RetailShell tenantId={tenant.id}>
          <SoftStudioPage
            products={products}
            tenant={tenant}
            config={config}
            navLinks={navLinks}
            footerLinks={footerLinks}
          />
        </RetailShell>
      )
    case 'luxe-essence':
      return (
        <RetailShell tenantId={tenant.id}>
          <LuxeEssenceStorefrontPage
            products={products}
            categories={categories}
            tenant={tenant}
            config={config}
            navLinks={navLinks}
            footerLinks={footerLinks}
          />
        </RetailShell>
      )
    default:
      return null
  }
}

export const RETAIL_LAYOUT_THEME_KEYS = ['soft-studio', 'luxe-essence'] as const

export function isRetailLayoutTheme(themeKey?: string): boolean {
  if (isPrivateLayoutTheme(themeKey)) return true
  return RETAIL_LAYOUT_THEME_KEYS.includes(themeKey as (typeof RETAIL_LAYOUT_THEME_KEYS)[number])
}
