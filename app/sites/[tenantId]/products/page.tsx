import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { ProductGrid } from '@/themes/retail/ProductGrid'
import { toThemeTenant } from '@/themes/retail/types'
import { fetchProducts } from '@/lib/storefront-api'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadRetailTenant()
  return { title: 'Shop', description: `Shop ${tenant.name}.` }
}

export default async function ProductsPage() {
  const tenant = await loadRetailTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const products = await fetchProducts(tenant.id, 48)

  return (
    <RetailShell tenantId={tenant.id}>
      <SiteHeader tenant={themeTenant} />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Shop all</h1>
        <p className="mt-3 max-w-xl text-slate-600">{themeTenant.tagline}</p>
        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      </main>
      <SiteFooter tenant={themeTenant} />
    </RetailShell>
  )
}
