import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from './types'
import { isPrivateLayoutTheme, renderPrivateLayout } from '@/themes/private/registry'

export function HomeServicesLayoutPage({
  themeKey,
  tenant,
  config,
  navLinks,
  footerLinks,
}: {
  themeKey?: string
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
}) {
  if (!isPrivateLayoutTheme(themeKey)) return null
  return renderPrivateLayout(
    { themeKey: themeKey!, tenant, config, navLinks, footerLinks },
    'home_services',
  )
}

export function isHomeServicesLayoutTheme(themeKey?: string): boolean {
  return isPrivateLayoutTheme(themeKey)
}
