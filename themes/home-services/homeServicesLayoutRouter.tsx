import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from './types'
import { createLayoutRouter } from '@/theme-kit/layout'

type HomeServicesLayoutProps = {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
}

const router = createLayoutRouter<HomeServicesLayoutProps, never>({
  vertical: 'home_services',
  themeKeys: [],
  cases: {},
})

export const HomeServicesLayoutPage = router.LayoutPage
export const isHomeServicesLayoutTheme = router.isLayoutTheme
