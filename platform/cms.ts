/**
 * torqERP's own CMS content (blog, pages) — stored under the platform CMS tenant
 * and read through the same public API tenant storefronts use. Publishing in the
 * admin revalidates the `tenant:<id>` tag, so edits go live without a deploy.
 */
import { fetchStorefrontBlogBySlug, fetchStorefrontBlogPosts } from '@/lib/cms-blog'
import { fetchStorefrontPageBySlug } from '@/lib/cms-pages'
import { PLATFORM_CMS_TENANT_ID } from './config'

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
