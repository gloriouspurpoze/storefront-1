import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant } from '@/themes/retail/types'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { fetchStorefrontNavLinks } from '@/lib/cms-content'
import { isRetailLayoutTheme } from '@/themes/retail/retailLayoutRouter'
import { LayoutThemePageShell } from '@/components/LayoutThemePageShell'
import { STOREFRONT_ADDON_FLAGS, isAddonActive } from '@/lib/storefrontAddons'
import { WishlistPageClient } from '@/components/wishlist/WishlistPageClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadRetailTenant()
  return { title: 'Wishlist', description: `Products you saved at ${tenant.name}.`, robots: { index: false } }
}

/** Wishlist add-on (`showWishlist`, retail). 404 when the add-on is not active. */
export default async function WishlistPage() {
  const h = await headers()
  if (h.get('x-tenant-vertical') !== 'retail') notFound()

  const tenant = await loadRetailTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const [config, headerNavLinks, footerNavLinks] = await Promise.all([
    fetchStorefrontConfig(tenant.id),
    fetchStorefrontNavLinks(tenant.id, 'header', 'retail'),
    fetchStorefrontNavLinks(tenant.id, 'footer', 'retail'),
  ])
  if (!isAddonActive(config, STOREFRONT_ADDON_FLAGS.wishlist)) notFound()

  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline || themeTenant.tagline

  const main = (
    <main className="sf-page-shell">
      <h1 className="sf-page-title">Your wishlist</h1>
      <div className="sf-page-body">
        <WishlistPageClient enabled />
      </div>
    </main>
  )

  if (isRetailLayoutTheme(config?.themeKey)) {
    return (
      <RetailShell tenantId={tenant.id}>
        <div className={config?.themeKey === 'luxe-essence' ? 'le-root min-h-screen' : 'ss-root min-h-screen'}>
          <LayoutThemePageShell config={config} siteName={siteName} tagline={tagline} wide navLinks={headerNavLinks}>
            {main}
          </LayoutThemePageShell>
        </div>
      </RetailShell>
    )
  }

  return (
    <RetailShell tenantId={tenant.id}>
      <SiteHeader tenant={themeTenant} config={config} navLinks={headerNavLinks} />
      {main}
      <SiteFooter tenant={themeTenant} navLinks={footerNavLinks} />
    </RetailShell>
  )
}
