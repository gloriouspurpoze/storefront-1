import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { SiteHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter } from '@/themes/restaurant/SiteFooter'
import { MenuSection } from '@/themes/restaurant/MenuSection'
import { toThemeTenant } from '@/themes/restaurant/types'
import { fetchMenu, fetchProducts, fetchStorefrontConfig } from '@/lib/storefront-api'
import type { StorefrontConfig } from '@/lib/storefront-api'

function showProducts(cfg: StorefrontConfig | null): boolean {
  const flags = cfg?.featureFlags as Record<string, boolean | undefined> | undefined
  const addons = cfg?.featureAddons ?? {}
  if (addons.products?.purchased) return true
  return flags?.showProducts !== false
}
import {
  isRestaurantLayoutTheme,
  RestaurantLayoutPage,
} from '@/themes/restaurant/restaurantLayoutRouter'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadRestaurantTenant()
  return { title: 'Menu', description: `Menu at ${tenant.name}.` }
}

export default async function MenuPage() {
  const tenant = await loadRestaurantTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const [menu, cfg] = await Promise.all([
    fetchMenu(tenant.id),
    fetchStorefrontConfig(tenant.id),
  ])
  const products = showProducts(cfg) ? await fetchProducts(tenant.id, 80) : []

  if (isRestaurantLayoutTheme(cfg?.themeKey)) {
    return (
      <RestaurantLayoutPage
        themeKey={cfg?.themeKey}
        menu={menu}
        products={products}
        tenant={themeTenant}
        config={cfg}
      />
    )
  }

  return (
    <RestaurantShell tenantId={tenant.id}>
      <SiteHeader tenant={themeTenant} />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/80">Menu</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-stone-900 sm:text-5xl">Our menu</h1>
        <p className="mt-3 max-w-lg text-stone-600">
          Seasonal ingredients, thoughtfully prepared. Dietary tags shown where applicable.
        </p>
        <div className="mt-12">
          <MenuSection categories={menu} />
        </div>
      </main>
      <SiteFooter tenant={themeTenant} />
    </RestaurantShell>
  )
}
