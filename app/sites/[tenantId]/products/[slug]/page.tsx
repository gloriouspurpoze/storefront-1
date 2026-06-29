import { notFound } from 'next/navigation'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { fetchProductBySlug, fetchStorefrontConfig } from '@/lib/storefront-api'
import { toThemeTenant } from '@/themes/retail/types'
import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'
import { ProductDetailView } from '@/components/ProductDetailView'

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
  const config = await fetchStorefrontConfig(tenant.id)
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const product = await fetchProductBySlug(tenant.id, slug)
  if (!product) notFound()

  const isLayout = isRetailLayoutTheme(config?.themeKey)

  return (
    <RetailShell tenantId={tenant.id}>
      <ProductDetailView
        product={product}
        tenant={themeTenant}
        config={config}
        themeKey={config?.themeKey}
      />
      {!isLayout ? <SiteFooter tenant={themeTenant} /> : null}
    </RetailShell>
  )
}
