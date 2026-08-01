'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import { useCart } from '../cart'
import type { ThemeTenant } from '../types'
import { LuxeEssenceFooter } from './LuxeEssenceFooter'
import { LuxeEssenceHeader } from './LuxeEssenceHeader'
import { LuxeEssenceMenuDrawer } from './LuxeEssenceMenuDrawer'
import '@/themes/retail/retail-page-shell.css'
import './luxe-essence.css'

/** Shared luxe header/footer shell for sub-routes (cart, checkout, policies, about, contact). */
export function LuxeEssenceLayoutPage({
  tenant,
  config,
  children,
  mainClassName = 'sf-page-shell',
  navLinks,
  footerLinks,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  children: ReactNode
  mainClassName?: string
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline || tenant.tagline
  const logoUrl = config?.branding?.logoUrl || tenant.logoUrl

  const { itemCount } = useCart()
  const { requireAuthForCart } = useCartAuthGate()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="le-root theme-luxe-essence">
      <LuxeEssenceMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        config={config}
        navLinks={navLinks}
      />
      <LuxeEssenceHeader
        config={config}
        siteName={siteName}
        tagline={tagline}
        logoUrl={logoUrl}
        menuOpen={menuOpen}
        itemCount={itemCount}
        onMenuOpen={() => setMenuOpen(true)}
        onCartOpen={() => {
          if (requireAuthForCart()) router.push('/cart')
        }}
      />
      <main className={mainClassName}>{children}</main>
      <LuxeEssenceFooter
        config={config}
        siteName={siteName}
        tagline={tagline}
        footerLinks={footerLinks}
      />
    </div>
  )
}
