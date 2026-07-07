'use client'

import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '../types'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'

export function LuxeEssenceAboutPage({
  tenant,
  config,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
}) {
  const siteName = config?.branding?.siteName || tenant.name

  return (
    <LuxeEssenceLayoutPage
      tenant={tenant}
      config={config}
      mainClassName="sf-page-shell sf-page-shell--narrow"
    >
      <p className="sf-page-eyebrow">About</p>
      <h1 className="sf-page-title">Our story</h1>
      <p className="sf-page-lead">
        {siteName} is built on quality, care, and consistency. Whether you are visiting for the
        first time or returning as a regular, we are glad you are here.
      </p>
      <nav className="le-policy-links" aria-label="Related links">
        <Link href="/">Back to store</Link>
        <Link href="/products">Shop all</Link>
        <Link href="/contact">Contact us</Link>
      </nav>
    </LuxeEssenceLayoutPage>
  )
}
