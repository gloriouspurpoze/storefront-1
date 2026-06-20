import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from './types'
import { isPrivateLayoutTheme, renderPrivateLayout } from '@/themes/private/registry'

export function HomeServicesLayoutPage({
  themeKey,
  tenant,
  config,
}: {
  themeKey?: string
  tenant: ThemeTenant
  config: StorefrontConfig | null
}) {
  if (!isPrivateLayoutTheme(themeKey)) return null
  return renderPrivateLayout({ themeKey: themeKey!, tenant, config }, 'home_services')
}

export function isHomeServicesLayoutTheme(themeKey?: string): boolean {
  return isPrivateLayoutTheme(themeKey)
}
