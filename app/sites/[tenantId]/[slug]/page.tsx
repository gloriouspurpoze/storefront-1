import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontPageBySlug } from '@/lib/cms-pages'
import { CmsStaticPageScreen } from '@/components/content/CmsStaticPageScreen'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ tenantId: string; slug: string }> }

/**
 * Catch-all for published CMS static pages (privacy, terms, custom slugs, …).
 * Concrete routes (`/about`, `/contact`, `/blog`, …) take precedence over this.
 */
export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
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
  if (!page) notFound()

  return <CmsStaticPageScreen page={page} />
}
