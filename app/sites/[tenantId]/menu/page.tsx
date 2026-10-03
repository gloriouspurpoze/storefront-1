import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { SiteHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter } from '@/themes/restaurant/SiteFooter'
import { MenuSectionInteractive } from '@/themes/restaurant/MenuSectionInteractive'
import { PageHeader } from '@/ui'
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
import { Suspense } from 'react'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'
import { QrTableContext } from '@/components/QrTableContext'
import { storefrontPathMetadata } from '@/lib/path-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return storefrontPathMetadata('/menu')
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
      <>
        <Suspense fallback={null}>
          <QrTableContext tenantId={tenant.id} />
        </Suspense>
        <RestaurantLayoutPage
          themeKey={cfg?.themeKey}
          menu={menu}
          products={products}
          tenant={themeTenant}
          config={cfg}
        />
      </>
    )
  }

  return (
    <RestaurantShell tenantId={tenant.id}>
      <SiteHeader tenant={themeTenant} config={cfg} />
      <main>
        <Suspense fallback={null}>
          <QrTableContext tenantId={tenant.id} />
        </Suspense>
        <PageHeader title="Our menu" crumbs={[{ label: 'Home', href: '/' }, { label: 'Menu' }]}>
          <p className="sf-subtle" style={{ marginTop: '0.5rem', maxWidth: '36rem' }}>
            Seasonal ingredients, thoughtfully prepared. Dietary tags shown where applicable.
          </p>
        </PageHeader>
        <div className="sf-container" style={{ paddingBottom: 'var(--sf-section-y)' }}>
          <MenuSectionInteractive categories={menu} />
        </div>
      </main>
      <SiteFooter tenant={themeTenant} config={cfg} />
    </RestaurantShell>
  )
}
