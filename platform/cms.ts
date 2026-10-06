/**
 * torqERP's own CMS content (blog, pages) — stored under the platform CMS tenant
 * and read through the same public API tenant storefronts use. Publishing in the
 * admin revalidates the `tenant:<id>` tag, so edits go live without a deploy.
 */
import { fetchStorefrontBlogBySlug, fetchStorefrontBlogPosts } from '@/lib/cms-blog'
import { fetchStorefrontPageBySlug } from '@/lib/cms-pages'
import { fetchStorefrontTestimonials, type StorefrontCmsTestimonial } from '@/lib/cms-content'
import { env } from '@/lib/env'
import { withTenantId } from '@/lib/tenant-headers'
import { PLATFORM_CMS_TENANT_ID } from './config'
import { selectFaqs, type CmsFaqRow, type FaqItem, type FaqPage } from './faqs'
import { selectTestimonials } from './testimonials'

export function platformBlogPosts(limit = 48) {
  return PLATFORM_CMS_TENANT_ID ? fetchStorefrontBlogPosts(PLATFORM_CMS_TENANT_ID, limit) : Promise.resolve([])
}

export async function platformBlogPost(slug: string) {
  if (!PLATFORM_CMS_TENANT_ID) return null
  const post = await fetchStorefrontBlogBySlug(PLATFORM_CMS_TENANT_ID, slug)
  return post && post.status !== 'draft' ? post : null
}

export function platformCmsPage(slug: string) {
  return PLATFORM_CMS_TENANT_ID ? fetchStorefrontPageBySlug(PLATFORM_CMS_TENANT_ID, slug) : Promise.resolve(null)
}

/** Strip risky tags/attributes from CMS HTML before rendering it on the public site. */
export function sanitizeCmsHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

/** Active CMS FAQs (all categories, in Display Order). Page selection lives in `faqs.ts`. */
async function platformCmsFaqRows(): Promise<CmsFaqRow[]> {
  if (!PLATFORM_CMS_TENANT_ID) return []
  try {
    const res = await fetch(`${env.API_BASE_URL.replace(/\/+$/, '')}/cms/faqs?limit=200`, {
      headers: withTenantId(PLATFORM_CMS_TENANT_ID, { Accept: 'application/json' }),
      next: {
        revalidate: 120,
        tags: [`tenant:${PLATFORM_CMS_TENANT_ID}`, `tenant:${PLATFORM_CMS_TENANT_ID}:cms-faqs`],
      },
    })
    if (!res.ok) return []
    const json = (await res.json().catch(() => null)) as { data?: { faqs?: CmsFaqRow[] } | CmsFaqRow[] } | null
    const data = json?.data
    return Array.isArray(data) ? data : data?.faqs ?? []
  } catch {
    return []
  }
}

/** FAQs for a page: the CMS ones when any exist, otherwise the built-in `fallback`. */
export async function pageFaqs(page: FaqPage, fallback: readonly FaqItem[]): Promise<FaqItem[]> {
  const fromCms = selectFaqs(await platformCmsFaqRows(), page)
  return fromCms.length ? fromCms : [...fallback]
}

/** Real, featured testimonials for a page (empty → the section is hidden). */
export async function pageTestimonials(page: FaqPage): Promise<StorefrontCmsTestimonial[]> {
  if (!PLATFORM_CMS_TENANT_ID) return []
  return selectTestimonials(await fetchStorefrontTestimonials(PLATFORM_CMS_TENANT_ID), page)
}

/** Fields from admin → CMS → SEO that may override a page's built-in metadata. */
export type SeoOverride = { title?: string; description?: string; ogImage?: string; noindex: boolean }

/**
 * SEO entry for an exact public path (`/`, `/pricing`, `/for-salons`) from the platform tenant.
 * Missing or inactive → null, and the page keeps its built-in title and description.
 */
export async function platformSeoOverride(path: string): Promise<SeoOverride | null> {
  if (!PLATFORM_CMS_TENANT_ID) return null
  try {
    const res = await fetch(`${env.API_BASE_URL.replace(/\/+$/, '')}/cms/seo/${encodeURIComponent(path)}`, {
      headers: withTenantId(PLATFORM_CMS_TENANT_ID, { Accept: 'application/json' }),
      next: {
        revalidate: 120,
        tags: [`tenant:${PLATFORM_CMS_TENANT_ID}`, `tenant:${PLATFORM_CMS_TENANT_ID}:seo`],
      },
    })
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as {
      data?: { title?: unknown; description?: unknown; ogImage?: unknown; robots?: unknown; isActive?: unknown } | null
    } | null
    const row = json?.data
    if (!row || row.isActive === false) return null
    const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
    const ogImage = text(row.ogImage)
    return {
      title: text(row.title),
      description: text(row.description),
      ogImage: ogImage && /^https:\/\//i.test(ogImage) ? ogImage : undefined,
      noindex: typeof row.robots === 'string' && /noindex/i.test(row.robots),
    }
  } catch {
    return null
  }
}
