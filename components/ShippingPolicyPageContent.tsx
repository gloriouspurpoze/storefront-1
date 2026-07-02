'use client'

import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { ShippingPolicyPanel } from '@/components/ShippingPolicyPanel'
import { StandardStorefrontNav } from '@/components/StandardStorefrontNav'
import type { StandardNavTenant } from '@/components/StandardStorefrontNav'

export function ShippingPolicyPageContent({
  config,
  siteName,
  variant = 'retail',
}: {
  config?: StorefrontConfig | null
  siteName: string
  variant?: 'retail' | 'restaurant'
}) {
  const title = variant === 'restaurant' ? 'Delivery policy' : 'Shipping policy'

  return (
    <main className="sf-page-shell sf-page-shell--narrow text-slate-800">
      <p className="sf-page-eyebrow">Policies</p>
      <h1 className="sf-page-title">{title}</h1>
      <p className="sf-page-lead">
        {variant === 'restaurant'
          ? `Thank you for ordering from ${siteName}. Below is how we handle delivery and pickup for online orders.`
          : `Thank you for shopping at ${siteName}. Below is how we handle shipping and delivery for online orders placed through our storefront.`}
      </p>

      <section className="mt-10">
        <ShippingPolicyPanel config={config} showFullPageLink={false} />
      </section>

      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href="/" className="font-medium text-slate-900 underline underline-offset-2">
          ← Back to store
        </Link>
        {variant === 'retail' ? (
          <Link href="/orders/track" className="font-medium text-slate-900 underline underline-offset-2">
            Track an order
          </Link>
        ) : null}
        <Link href="/account" className="font-medium text-slate-900 underline underline-offset-2">
          My orders
        </Link>
      </div>
    </main>
  )
}

export function ShippingPolicyPageShell({
  tenant,
  config,
  variant = 'retail',
  children,
}: {
  tenant: StandardNavTenant
  config?: StorefrontConfig | null
  variant?: 'retail' | 'restaurant'
  children: React.ReactNode
}) {
  return (
    <>
      <StandardStorefrontNav tenant={tenant} config={config} variant={variant} />
      {children}
    </>
  )
}
