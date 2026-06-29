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
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-slate-800">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Policies</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-6 max-w-prose text-pretty text-slate-600">
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
