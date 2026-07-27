import { env } from './env'
import { withTenantId } from './tenant-headers'

export const CMS_PAGE_REVALIDATE = 120

const ABOUT_SLUG_CANDIDATES = ['about', 'about-us'] as const

type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  page?: T
}

export type StorefrontCmsPage = {
  _id?: string
  title: string
  slug: string
  content?: string
  excerpt?: string
  status?: string
  seo?: {
    title?: string
    description?: string
  }
}

function apiUrl(path: string): string {
  return `${env.API_BASE_URL.replace(/\/+$/, '')}${path}`
}

function isPublishedPage(page: StorefrontCmsPage | null): page is StorefrontCmsPage {
  if (!page?.title?.trim()) return false
  const status = (page.status || 'published').toLowerCase()
  return status === 'published' || status === 'public'
}

async function fetchCmsJson<T>(
  tenantId: string,
  path: string,
  revalidateSeconds: number,
): Promise<T | null> {
  if (!tenantId) return null
  try {
    const res = await fetch(apiUrl(path), {
      method: 'GET',
      headers: withTenantId(tenantId, { Accept: 'application/json' }),
      next: {
        revalidate: revalidateSeconds,
        tags: [`tenant:${tenantId}`, `tenant:${tenantId}:cms-pages`],
      },
    })
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | T | null
    if (!json || typeof json !== 'object') return null
    if ('success' in json && json.success === false) return null
    // Backend shape: { success, data: { page } } or { success, data: page }
    if ('data' in json && json.data != null) {
      const data = json.data as T | { page?: T }
      if (data && typeof data === 'object' && 'page' in data && data.page != null) {
        return data.page as T
      }
      return data as T
    }
    if ('page' in json && (json as ApiEnvelope<T>).page != null) {
      return (json as ApiEnvelope<T>).page as T
    }
    return json as T
  } catch {
    return null
  }
}

/** Single CMS static page by slug — public tenant CMS API. */
export async function fetchStorefrontPageBySlug(
  tenantId: string,
  slug: string,
): Promise<StorefrontCmsPage | null> {
  if (!slug.trim()) return null
  const page = await fetchCmsJson<StorefrontCmsPage>(
    tenantId,
    `/cms/pages/slug/${encodeURIComponent(slug.trim())}`,
    CMS_PAGE_REVALIDATE,
  )
  return isPublishedPage(page) ? page : null
}

/** About page: try `/about` then template slug `/about-us`. */
export async function fetchStorefrontAboutPage(
  tenantId: string,
): Promise<StorefrontCmsPage | null> {
  for (const slug of ABOUT_SLUG_CANDIDATES) {
    const page = await fetchStorefrontPageBySlug(tenantId, slug)
    if (page) return page
  }
  return null
}
