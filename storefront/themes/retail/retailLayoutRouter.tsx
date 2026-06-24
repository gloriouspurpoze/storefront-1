import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from './types'
import { RetailShell } from './RetailShell'
import { SoftStudioPage } from './soft-studio'
import { LuxeEssencePage } from './luxe-essence'
import { isPrivateLayoutTheme, renderPrivateLayout } from '@/themes/private/registry'

/** Full-page retail / e-commerce layout templates (themeKey → React bundle). */
export function RetailLayoutPage({
  themeKey,
  products,
  tenant,
  config,
}: {
  themeKey?: string
  products: PublicProduct[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
}) {
  if (isPrivateLayoutTheme(themeKey)) {
    return renderPrivateLayout({ themeKey: themeKey!, products, tenant, config }, 'retail')
  }

  switch (themeKey) {
    case 'soft-studio':
      return (
        <RetailShell tenantId={tenant.id}>
          <SoftStudioPage products={products} tenant={tenant} config={config} />
        </RetailShell>
      )
    case 'luxe-essence':
      return (
        <RetailShell tenantId={tenant.id}>
          <LuxeEssencePage products={products} tenant={tenant} config={config} />
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
