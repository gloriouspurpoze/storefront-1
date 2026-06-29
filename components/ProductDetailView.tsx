'use client'

import Link from 'next/link'
import { StandardStorefrontNav } from '@/components/StandardStorefrontNav'
import { LayoutThemePageShell } from '@/components/LayoutThemePageShell'
import { AddToCartButton } from '@/themes/retail/AddToCartButton'
import { formatMoney } from '@/lib/format'
import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '@/themes/retail/types'
import '@/themes/retail/soft-studio/soft-studio.css'
import '@/themes/retail/luxe-essence/luxe-essence.css'

export function ProductDetailView({
  product,
  tenant,
  config,
  themeKey,
}: {
  product: PublicProduct
  tenant: ThemeTenant
  config: StorefrontConfig | null
  themeKey?: string
}) {
  const isSoftStudio = themeKey === 'soft-studio'
  const isLuxe = themeKey === 'luxe-essence'

  const detailBody = (
    <>
      <Link href="/#products" className="text-sm opacity-80 hover:opacity-100">
        ← Back to shop
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl font-bold text-slate-300">
              {product.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{product.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-semibold">{formatMoney(product.price, product.currency)}</span>
            {product.originalPrice && product.originalPrice > product.price ? (
              <span className="text-lg opacity-60 line-through">
                {formatMoney(product.originalPrice, product.currency)}
              </span>
            ) : null}
          </div>
          {product.description || product.shortDescription ? (
            <p className="mt-6 text-pretty opacity-80">{product.description ?? product.shortDescription}</p>
          ) : null}
          <div className="mt-8 max-w-sm">
            <AddToCartButton product={product} />
          </div>
          <p className="mt-6 text-sm opacity-70">
            <Link href="/shipping-policy" className="underline underline-offset-2">
              View shipping policy
            </Link>
          </p>
        </div>
      </div>
    </>
  )

  if (isSoftStudio) {
    return (
      <div className="ss-root min-h-screen">
        <LayoutThemePageShell config={config} siteName={tenant.name} tagline={tenant.tagline}>
          <main className="ss-section mx-auto max-w-6xl px-4 py-12">{detailBody}</main>
        </LayoutThemePageShell>
      </div>
    )
  }

  if (isLuxe) {
    return (
      <div className="le-root min-h-screen">
        <LayoutThemePageShell config={config} siteName={tenant.name} tagline={tenant.tagline} wide>
          <main className="mx-auto max-w-6xl px-4 py-12">{detailBody}</main>
        </LayoutThemePageShell>
      </div>
    )
  }

  return (
    <>
      <StandardStorefrontNav tenant={tenant} config={config} variant="retail" />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">{detailBody}</main>
    </>
  )
}
