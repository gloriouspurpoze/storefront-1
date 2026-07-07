import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontBlogPosts, CMS_BLOG_LIST_REVALIDATE } from '@/lib/cms-blog'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { StorefrontBlogIndex } from '@/components/content/StorefrontBlogIndex'
import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader as HsHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter as HsFooter } from '@/themes/home-services/SiteFooter'
import { toThemeTenant as toHsTenant } from '@/themes/home-services/types'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { SiteHeader as RestHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter as RestFooter } from '@/themes/restaurant/SiteFooter'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader as RetailHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter as RetailFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant as toRetailTenant } from '@/themes/retail/types'

export const revalidate = CMS_BLOG_LIST_REVALIDATE

type RouteParams = { params: Promise<{ tenantId: string }> }

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { tenantId } = await params
  const resolved = await loadTenantFromRequest()
  if (!resolved || resolved.id !== tenantId) return { title: 'Blog' }
  const config = await fetchStorefrontConfig(tenantId)
  const siteName = config?.branding?.siteName || resolved.name
  return {
    title: 'Blog',
    description: `Guides and updates from ${siteName}.`,
  }
}

export default async function BlogIndexPage({ params }: RouteParams) {
  const { tenantId } = await params
  const resolved = await loadTenantFromRequest()
  if (!resolved || resolved.id !== tenantId) notFound()

  const [posts, config] = await Promise.all([
    fetchStorefrontBlogPosts(tenantId),
    fetchStorefrontConfig(tenantId),
  ])
  const siteName = config?.branding?.siteName || resolved.name
  const body = <StorefrontBlogIndex tenantId={tenantId} siteName={siteName} posts={posts} />

  switch (resolved.verticalKey) {
    case 'home_services': {
      const tenant = await loadHomeServicesTenant()
      const theme = toHsTenant(tenant, tenant.fallbackTagline)
      return (
        <>
          <HsHeader tenant={theme} />
          {body}
          <HsFooter tenant={theme} />
        </>
      )
    }
    case 'restaurant': {
      const tenant = await loadRestaurantTenant()
      const theme = toRestTenant(tenant, tenant.fallbackTagline)
      return (
        <>
          <RestHeader tenant={theme} />
          {body}
          <RestFooter tenant={theme} />
        </>
      )
    }
    case 'retail':
    default: {
      const tenant = await loadRetailTenant()
      const theme = toRetailTenant(tenant, tenant.fallbackTagline)
      return (
        <RetailShell tenantId={tenant.id}>
          <RetailHeader tenant={theme} />
          {body}
          <RetailFooter tenant={theme} />
        </RetailShell>
      )
    }
  }
}
