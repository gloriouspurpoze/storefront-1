import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { SiteHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter } from '@/themes/restaurant/SiteFooter'
import { MenuSection } from '@/themes/restaurant/MenuSection'
import { toThemeTenant } from '@/themes/restaurant/types'
import { fetchMenu } from '@/lib/storefront-api'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadRestaurantTenant()
  return { title: 'Menu', description: `Menu at ${tenant.name}.` }
}

export default async function MenuPage() {
  const tenant = await loadRestaurantTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const menu = await fetchMenu(tenant.id)

  return (
    <>
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
    </>
  )
}
