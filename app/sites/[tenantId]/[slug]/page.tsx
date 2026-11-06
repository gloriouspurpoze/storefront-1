import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontPageBySlug } from '@/lib/cms-pages'
import { fetchProductBySlug } from '@/lib/storefront-api'
import { CmsStaticPageScreen } from '@/components/content/CmsStaticPageScreen'
import { seoOverridable } from '@/lib/tenant-seo'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ tenantId: string; slug: string }> }

/**
 * Catch-all for published CMS static pages (privacy, terms, custom slugs, …).
 * Concrete routes (`/about`, `/contact`, `/blog`, …) take precedence over this.
 */
async function baseGenerateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { tenantId, slug } = await params
  const resolved = await loadTenantFromRequest()
  if (!resolved || resolved.id !== tenantId) return { title: 'Page' }
  const page = await fetchStorefrontPageBySlug(tenantId, slug)
  if (!page) return { title: 'Not found' }
  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.excerpt,
  }
}

export default async function CmsStaticSlugPage({ params }: RouteParams) {
  const { tenantId, slug } = await params
  const resolved = await loadTenantFromRequest()
  if (!resolved || resolved.id !== tenantId) notFound()

  const page = await fetchStorefrontPageBySlug(tenantId, slug)
  if (!page) {
    // Short/vanity product links (`/Classic-OG-NYC-Cookie`) → the real product page.
    const product = await fetchProductBySlug(tenantId, decodeURIComponent(slug).trim().toLowerCase())
    if (product?.slug) permanentRedirect(`/products/${encodeURIComponent(product.slug)}`)
    notFound()
  }

  return <CmsStaticPageScreen page={page} />
}

export const generateMetadata = seoOverridable((p) => `/${p.slug}`, baseGenerateMetadata)
