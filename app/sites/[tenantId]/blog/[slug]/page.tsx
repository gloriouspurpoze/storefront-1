import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontBlogBySlug } from '@/lib/cms-blog'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { StorefrontBlogArticle } from '@/components/content/StorefrontBlogArticle'
import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader as HsHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter as HsFooter } from '@/themes/home-services/SiteFooter'
import { toThemeTenant as toHsTenant } from '@/themes/home-services/types'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'
import { SiteHeader as RestHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter as RestFooter } from '@/themes/restaurant/SiteFooter'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { MenuFastCardsBlogArticlePage } from '@/themes/restaurant/menufast/MenuFastCardsBlogArticlePage'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader as RetailHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter as RetailFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant as toRetailTenant } from '@/themes/retail/types'
import { LuxeEssenceBlogArticlePage } from '@/themes/retail/luxe-essence/LuxeEssenceBlogArticlePage'

/** Must be a literal — Next.js cannot statically analyze imported revalidate values. */
export const revalidate = 180

type RouteParams = { params: Promise<{ tenantId: string; slug: string }> }

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { tenantId, slug } = await params
  const resolved = await loadTenantFromRequest()
  if (!resolved || resolved.id !== tenantId) return { title: 'Blog' }
  const post = await fetchStorefrontBlogBySlug(tenantId, slug)
  if (!post) return { title: 'Article not found' }
  const title = post.seo?.metaTitle || post.seo?.title || post.title
  const description = post.seo?.description || post.excerpt
  return { title, description }
}

export default async function BlogPostPage({ params }: RouteParams) {
  const { tenantId, slug } = await params
  const resolved = await loadTenantFromRequest()
  if (!resolved || resolved.id !== tenantId) notFound()

  const [post, config] = await Promise.all([
    fetchStorefrontBlogBySlug(tenantId, slug),
    fetchStorefrontConfig(tenantId),
  ])
  if (!post || post.status === 'draft') notFound()

  const body = <StorefrontBlogArticle tenantId={tenantId} post={post} />

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
      if (config?.themeKey === 'menufast-cards') {
        return <MenuFastCardsBlogArticlePage tenant={theme} config={config} post={post} />
      }
      return (
        <RestaurantShell tenantId={tenant.id}>
          <RestHeader tenant={theme} />
          {body}
          <RestFooter tenant={theme} />
        </RestaurantShell>
      )
    }
    case 'retail':
    default: {
      const tenant = await loadRetailTenant()
      const theme = toRetailTenant(tenant, tenant.fallbackTagline)
      if (config?.themeKey === 'luxe-essence') {
        return (
          <RetailShell tenantId={tenant.id}>
            <LuxeEssenceBlogArticlePage tenant={theme} config={config} post={post} />
          </RetailShell>
        )
      }
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
