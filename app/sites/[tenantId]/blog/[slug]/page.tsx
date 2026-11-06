import { headers } from 'next/headers'
import { JsonLd } from '@/components/seo/JsonLd'
import { resolveStorefrontBaseUrl } from '@/lib/product-seo'
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
import { fetchStorefrontMenuLinks } from '@/lib/cms-content'
import { isBrownButterNavEnabled, isBrownButterTheme } from '@/themes/private/thebrownbutter/brownButterNav'
import { BrownButterJournalArticle } from '@/themes/private/thebrownbutter/BrownButterJournal'
import { seoOverridable } from '@/lib/tenant-seo'

/** Must be a literal — Next.js cannot statically analyze imported revalidate values. */
export const revalidate = 180

type RouteParams = { params: Promise<{ tenantId: string; slug: string }> }

async function baseGenerateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { tenantId, slug } = await params
  const resolved = await loadTenantFromRequest()
  if (!resolved || resolved.id !== tenantId) return { title: 'Blog' }
  const post = await fetchStorefrontBlogBySlug(tenantId, slug)
  if (!post) return { title: 'Article not found' }
  const title = post.seo?.metaTitle || post.seo?.title || post.title
  const description = post.seo?.description || post.excerpt
  const path = `/blog/${encodeURIComponent(post.slug || slug)}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title,
      description,
      url: path,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      images: post.featuredImage ? [{ url: post.featuredImage, alt: post.featuredImageAlt || post.title }] : undefined,
    },
  }
}

/** BlogPosting structured data in the server HTML, around whichever theme renders the post. */
export default async function BlogPostPage(props: RouteParams) {
  const { tenantId, slug } = await props.params
  const [post, config, page] = await Promise.all([
    fetchStorefrontBlogBySlug(tenantId, slug),
    fetchStorefrontConfig(tenantId),
    BlogPostBody(props),
  ])
  if (!post) return page
  const h = await headers()
  const base = resolveStorefrontBaseUrl(config, h.get('host'), h.get('x-forwarded-proto') ?? 'https')
  const author = typeof post.author === 'string' ? post.author : post.author?.name
  const siteName = config?.branding?.siteName
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seo?.metaTitle || post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    image: post.featuredImage ? [post.featuredImage] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: author ? { '@type': 'Person', name: author } : siteName ? { '@type': 'Organization', name: siteName } : undefined,
    publisher: siteName ? { '@type': 'Organization', name: siteName, logo: config?.branding?.logoUrl } : undefined,
    mainEntityOfPage: base ? `${base}/blog/${encodeURIComponent(post.slug || slug)}` : undefined,
    keywords: post.tags?.length ? post.tags.join(', ') : undefined,
  }
  return (
    <>
      <JsonLd id="blog-posting-jsonld" data={ld} />
      {page}
    </>
  )
}

async function BlogPostBody({ params }: RouteParams) {
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
      if (isBrownButterTheme(config?.themeKey)) {
        if (!isBrownButterNavEnabled(config, 'showJournalNav')) notFound()
        const navLinks = await fetchStorefrontMenuLinks(tenant.id, 'header')
        return (
          <BrownButterJournalArticle
            tenant={theme}
            config={config}
            navLinks={navLinks}
            post={post}
          />
        )
      }
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

export const generateMetadata = seoOverridable((p) => `/blog/${p.slug}`, baseGenerateMetadata)
