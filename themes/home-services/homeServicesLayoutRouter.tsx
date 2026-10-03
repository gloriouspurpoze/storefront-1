import type { ReactNode } from 'react'
import type { StorefrontCmsFaq, StorefrontCmsTestimonial, StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { PublicService, ThemeTenant } from './types'
import { createLayoutRouter } from '@/theme-kit/layout'
import { TradeProPage } from './trade-pro'

type HomeServicesLayoutProps = {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
  /** Paid add-on homepage blocks (AMC / loyalty / B2B), rendered above the theme footer. */
  addonsSlot?: ReactNode
  services?: PublicService[]
  faqs?: StorefrontCmsFaq[]
  testimonials?: StorefrontCmsTestimonial[]
}

const router = createLayoutRouter<HomeServicesLayoutProps, 'trade-pro'>({
  vertical: 'home_services',
  themeKeys: ['trade-pro'],
  cases: {
    'trade-pro': (p) => (
      <TradeProPage
        tenant={p.tenant}
        config={p.config}
        navLinks={p.navLinks}
        footerLinks={p.footerLinks}
        addonsSlot={p.addonsSlot}
        services={p.services ?? []}
        faqs={p.faqs ?? []}
        testimonials={p.testimonials ?? []}
      />
    ),
  },
})

export const HomeServicesLayoutPage = router.LayoutPage
export const isHomeServicesLayoutTheme = router.isLayoutTheme
