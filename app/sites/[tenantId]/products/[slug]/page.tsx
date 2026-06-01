import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { AddToCartButton } from '@/themes/retail/AddToCartButton'
import { formatMoney } from '@/themes/retail/cart'
import { toThemeTenant } from '@/themes/retail/types'
import { fetchProductBySlug } from '@/lib/storefront-api'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const tenant = await loadRetailTenant()
  const product = await fetchProductBySlug(tenant.id, slug)
  if (!product) return { title: 'Product' }
  return {
    title: product.name,
    description: product.shortDescription ?? product.description,
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const tenant = await loadRetailTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const product = await fetchProductBySlug(tenant.id, slug)
  if (!product) notFound()

  return (
    <RetailShell tenantId={tenant.id}>
      <SiteHeader tenant={themeTenant} />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <Link href="/products" className="text-sm text-indigo-700 hover:underline">
          ← Back to shop
        </Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl font-bold text-slate-300">
                {product.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{product.name}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-semibold text-slate-900">
                {formatMoney(product.price, product.currency)}
              </span>
              {product.originalPrice && product.originalPrice > product.price ? (
                <span className="text-lg text-slate-400 line-through">
                  {formatMoney(product.originalPrice, product.currency)}
                </span>
              ) : null}
            </div>
            {product.description || product.shortDescription ? (
              <p className="mt-6 text-pretty text-slate-600">
                {product.description ?? product.shortDescription}
              </p>
            ) : null}
            <div className="mt-8 max-w-sm">
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter tenant={themeTenant} />
    </RetailShell>
  )
}
