import { env } from './env'
import { withTenantId } from './tenant-headers'

export const CMS_BLOG_LIST_REVALIDATE = 120
export const CMS_BLOG_POST_REVALIDATE = 180

type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  posts?: T
  post?: T
}

export type StorefrontBlogPost = {
  _id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featuredImage?: string
  featuredImageAlt?: string
  category?: string | { name?: string; slug?: string }
  tags?: string[]
  author?: string | { name?: string }
  status?: string
  publishedAt?: string
  updatedAt?: string
  readingTime?: number
  seo?: {
    title?: string
    metaTitle?: string
    description?: string
  }
}

export type StorefrontBlogListItem = {
  slug: string
  title: string
  description: string
  date: string
  author: string
  category: string
  readingTime: number
}

function apiUrl(path: string): string {
  return `${env.API_BASE_URL.replace(/\/+$/, '')}${path}`
}

function blogCategoryLabel(raw: StorefrontBlogPost['category']): string {
  if (!raw) return 'General'
  if (typeof raw === 'string') return raw
  return raw.name?.trim() || raw.slug?.trim() || 'General'
}

function blogAuthorLabel(raw: StorefrontBlogPost['author']): string {
  if (!raw) return 'Editorial'
  if (typeof raw === 'string') return raw
  return raw.name?.trim() || 'Editorial'
}

function mapListItem(row: StorefrontBlogPost): StorefrontBlogListItem | null {
  const slug = row.slug?.trim()
  const title = row.title?.trim()
  if (!slug || !title) return null
  const description =
    row.excerpt?.trim() ||
    row.seo?.description?.trim() ||
    ''
  const date = row.publishedAt || row.updatedAt || new Date().toISOString()
  return {
    slug,
    title,
    description,
    date,
    author: blogAuthorLabel(row.author),
    category: blogCategoryLabel(row.category),
    readingTime: row.readingTime && row.readingTime > 0 ? row.readingTime : 5,
  }
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
        tags: [`tenant:${tenantId}`, `tenant:${tenantId}:blog`],
      },
    })
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | T | null
    if (!json || typeof json !== 'object') return null
    if ('success' in json && json.success === false) return null
    // Backend shapes: { success, data: { posts, pagination } } | { success, data: { post } } | flat
    if ('data' in json && json.data != null) {
      const data = json.data as T | { post?: T; posts?: unknown }
      if (data && typeof data === 'object' && 'post' in data && data.post != null && !('posts' in data)) {
        return data.post as T
      }
      return data as T
    }
    if ('post' in json && (json as ApiEnvelope<T>).post != null) {
      return (json as ApiEnvelope<T>).post as T
    }
    if ('posts' in json && json.posts != null) return json.posts as T
    return json as T
  } catch {
    return null
  }
}

/** Paginated published blog catalog for tenant storefront index. */
export async function fetchStorefrontBlogPosts(
  tenantId: string,
  limit = 48,
): Promise<StorefrontBlogListItem[]> {
  const raw = await fetchCmsJson<{ posts?: StorefrontBlogPost[] } | StorefrontBlogPost[]>(
    tenantId,
    `/cms/blogs?status=published&limit=${limit}&page=1`,
    CMS_BLOG_LIST_REVALIDATE,
  )
  const rows = Array.isArray(raw) ? raw : raw?.posts ?? []
  return rows.map(mapListItem).filter((r): r is StorefrontBlogListItem => r !== null)
}

/** Single post by slug — public tenant CMS API. */
export async function fetchStorefrontBlogBySlug(
  tenantId: string,
  slug: string,
): Promise<StorefrontBlogPost | null> {
  if (!slug.trim()) return null
  return fetchCmsJson<StorefrontBlogPost>(
    tenantId,
    `/cms/blogs/slug/${encodeURIComponent(slug.trim())}`,
    CMS_BLOG_POST_REVALIDATE,
  )
}
