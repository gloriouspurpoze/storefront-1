'use client'

import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { ShippingPolicyPanel } from '@/components/ShippingPolicyPanel'
import type { ThemeTenant } from '../types'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'

export function LuxeEssenceShippingPolicyPage({
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
      mainClassName="sf-page-shell sf-page-shell--narrow le-policy-page"
    >
      <p className="sf-page-eyebrow">Policies</p>
      <h1 className="sf-page-title">Shipping policy</h1>
      <p className="sf-page-lead">
        Thank you for shopping at {siteName}. Below is how we handle shipping and delivery for online
        orders placed through our storefront.
      </p>

      <section className="le-policy-panel" aria-label="Shipping policy details">
        <ShippingPolicyPanel config={config} showFullPageLink={false} className="le-policy-panel__body" />
      </section>

      <nav className="le-policy-links" aria-label="Related links">
        <Link href="/">Back to store</Link>
        <Link href="/orders/track">Track an order</Link>
        <Link href="/account">My orders</Link>
      </nav>
    </LuxeEssenceLayoutPage>
  )
}
