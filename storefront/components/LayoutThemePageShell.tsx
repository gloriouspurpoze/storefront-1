'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import { StorefrontHeaderBar, StorefrontMenuDrawer } from '@/components/StorefrontMenuDrawer'

export function LayoutThemePageShell({
  config,
  siteName,
  tagline,
  children,
  wide,
  showShippingPolicy = true,
}: {
  config: StorefrontConfig | null
  siteName: string
  tagline?: string
  children: ReactNode
  wide?: boolean
  showShippingPolicy?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <StorefrontMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        config={config}
        showShippingPolicy={showShippingPolicy}
      />
      <StorefrontHeaderBar
        title={siteName}
        subtitle={tagline}
        onMenuOpen={() => setMenuOpen(true)}
        wide={wide}
        actions={
          <>
            <AccountProfileLink className="inline-flex items-center justify-center hover:opacity-80" />
            <Link href="/" className="inline-flex items-center justify-center text-lg hover:opacity-80" aria-label="Back to store" title="Back to store">
              🏠
            </Link>
          </>
        }
      />
      {children}
    </>
  )
}
