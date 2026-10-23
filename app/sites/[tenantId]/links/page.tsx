import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { isBrownButterTheme } from '@/themes/private/thebrownbutter/brownButterNav'
import { BrownButterLinksView } from '@/themes/private/thebrownbutter/BrownButterLinksView'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadTenantFromRequest()
  if (!tenant) return { title: { absolute: 'Links' } }
  const cfg = await fetchStorefrontConfig(tenant.id)
  const siteName = cfg?.branding?.siteName || tenant.name
  const page = cfg?.seo?.pages?.['/links']
  const title = page?.title || `${siteName} — Links`
  const description =
    page?.description ||
    `${siteName} — all our links in one place. Order fresh cookies, follow us on Instagram, and more.`
  return {
    title: { absolute: title },
    description,
    robots: page?.noindex ? { index: false, follow: cfg?.seo?.robots?.followLinks !== false } : undefined,
    openGraph: {
      title,
      description,
      type: 'website' as const,
    },
  }
}

export default async function LinksPage() {
  const resolved = await loadTenantFromRequest()
  if (!resolved || resolved.verticalKey !== 'restaurant') notFound()

  const tenant = await loadRestaurantTenant()
  const config = await fetchStorefrontConfig(tenant.id)
  if (!isBrownButterTheme(config?.themeKey)) notFound()

  const host = (await headers()).get('host')?.replace(/:\d+$/, '')
  const siteName = config?.branding?.siteName || tenant.name

  return (
    <BrownButterLinksView
      tenant={toRestTenant(tenant, config?.branding?.tagline ?? '')}
      config={config}
      homeLabel={host || siteName}
    />
  )
}
