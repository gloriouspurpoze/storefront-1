import { env } from './env'
import { withTenantId } from './tenant-headers'

export const CMS_CONTENT_REVALIDATE = 120

export type StorefrontNavLink = { href: string; label: string }

export type StorefrontCmsFaq = { question: string; answer: string }

export type StorefrontCmsTestimonial = {
  customerName: string
  content: string
  rating?: number
  customerRole?: string
  title?: string
}

type CmsMenuItem = {
  label?: string
  url?: string
  type?: string
  isActive?: boolean
  order?: number
  children?: CmsMenuItem[]
}

type CmsMenu = {
  items?: CmsMenuItem[]
  isActive?: boolean
  location?: string
}

type ApiEnvelope<T> = {
  success?: boolean
  data?: T
}

function apiUrl(path: string): string {
  return `${env.API_BASE_URL.replace(/\/+$/, '')}${path}`
}

/** Normalize CMS menu URLs for Next.js Link hrefs. */
export function normalizeCmsMenuHref(url: string): string | null {
  const raw = url.trim()
  if (!raw || raw === '#') return null
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw
  if (raw.startsWith('/')) return raw
  return `/${raw}`
}

/**
 * Depth-first flatten of CMS menu items to `{ href, label }[]`.
 * Keep in sync with `src/lib/cmsMenuNavLinks.ts` (admin unit tests).
 */
export function flattenCmsMenuItems(items: CmsMenuItem[] | null | undefined): StorefrontNavLink[] {
  if (!items?.length) return []
  const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const out: StorefrontNavLink[] = []

  for (const item of sorted) {
    if (item.isActive === false) continue
    if (item.type === 'divider') {
      if (item.children?.length) out.push(...flattenCmsMenuItems(item.children))
      continue
    }
    const label = item.label?.trim()
    const href = item.url ? normalizeCmsMenuHref(item.url) : null
    if (label && href) out.push({ href, label })
    if (item.children?.length) out.push(...flattenCmsMenuItems(item.children))
  }

  return out
}

export function defaultHeaderNavLinks(
  vertical: 'home_services' | 'restaurant' | 'retail' | string,
): StorefrontNavLink[] {
  if (vertical === 'home_services') {
    return [
      { href: '/services', label: 'Services' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ]
  }
  if (vertical === 'restaurant') {
    return [
      { href: '/menu', label: 'Menu' },
      { href: '/reserve', label: 'Reservations' },
      { href: '/contact', label: 'Contact' },
    ]
  }
  return [
    { href: '/products', label: 'Shop all' },
    { href: '/orders/track', label: 'Track order' },
    { href: '/shipping-policy', label: 'Shipping' },
  ]
}

export function defaultFooterNavLinks(
  vertical: 'home_services' | 'restaurant' | 'retail' | string,
): StorefrontNavLink[] {
  if (vertical === 'home_services') {
    return [
      { href: '/services', label: 'Browse all' },
      { href: '/book', label: 'Book now' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ]
  }
  if (vertical === 'restaurant') {
    return [
      { href: '/menu', label: 'Menu' },
      { href: '/reserve', label: 'Reservations' },
      { href: '/contact', label: 'Contact' },
    ]
  }
  return [
    { href: '/products', label: 'Shop all' },
    { href: '/cart', label: 'Cart' },
    { href: '/orders/track', label: 'Track order' },
    { href: '/shipping-policy', label: 'Shipping' },
  ]
}

async function fetchCmsJson<T>(
  tenantId: string,
  path: string,
  revalidateSeconds: number,
  tag: string,
): Promise<T | null> {
  if (!tenantId) return null
  try {
    const res = await fetch(apiUrl(path), {
      method: 'GET',
      headers: withTenantId(tenantId, { Accept: 'application/json' }),
      next: {
        revalidate: revalidateSeconds,
        tags: [`tenant:${tenantId}`, `tenant:${tenantId}:${tag}`],
      },
    })
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | T | null
    if (!json || typeof json !== 'object') return null
    if ('success' in json && json.success === false) return null
    if ('data' in json && json.data != null) return json.data as T
    return json as T
  } catch {
    return null
  }
}

/** Prefer CMS menu links; otherwise keep theme/vertical hardcoded fallback. */
export function resolveThemeNavLinks(
  cms: StorefrontNavLink[] | null | undefined,
  fallback: StorefrontNavLink[],
): StorefrontNavLink[] {
  return cms?.length ? cms : fallback
}

/** Active CMS menu for a location, flattened. Empty/404 → []. */
export async function fetchStorefrontMenuLinks(
  tenantId: string,
  location: 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom' = 'header',
): Promise<StorefrontNavLink[]> {
  const raw = await fetchCmsJson<{ menu?: CmsMenu } | CmsMenu>(
    tenantId,
    `/cms/menus/location/${encodeURIComponent(location)}`,
    CMS_CONTENT_REVALIDATE,
    'cms-menus',
  )
  if (!raw) return []
  const menu = 'menu' in raw && raw.menu ? raw.menu : (raw as CmsMenu)
  if (menu.isActive === false) return []
  return flattenCmsMenuItems(menu.items)
}

export async function fetchStorefrontNavLinks(
  tenantId: string,
  location: 'header' | 'footer',
  vertical: string,
): Promise<StorefrontNavLink[]> {
  const cms = await fetchStorefrontMenuLinks(tenantId, location)
  if (cms.length) return cms
  return location === 'header' ? defaultHeaderNavLinks(vertical) : defaultFooterNavLinks(vertical)
}

/** Active FAQs from CMS `/cms/faqs`. */
export async function fetchStorefrontFaqs(tenantId: string): Promise<StorefrontCmsFaq[]> {
  const raw = await fetchCmsJson<{ faqs?: StorefrontCmsFaq[] } | StorefrontCmsFaq[]>(
    tenantId,
    '/cms/faqs?limit=50',
    CMS_CONTENT_REVALIDATE,
    'cms-faqs',
  )
  const rows = Array.isArray(raw) ? raw : raw?.faqs ?? []
  return rows
    .map((row) => ({
      question: String(row.question ?? '').trim(),
      answer: String(row.answer ?? '').trim(),
    }))
    .filter((row) => row.question && row.answer)
}

/** Featured testimonials from CMS `/cms/testimonials`. */
export async function fetchStorefrontTestimonials(
  tenantId: string,
): Promise<StorefrontCmsTestimonial[]> {
  const raw = await fetchCmsJson<
    StorefrontCmsTestimonial[] | { testimonials?: StorefrontCmsTestimonial[] }
  >(tenantId, '/cms/testimonials', CMS_CONTENT_REVALIDATE, 'cms-testimonials')
  const rows = Array.isArray(raw) ? raw : raw?.testimonials ?? []
  return rows
    .map((row) => ({
      customerName: String(row.customerName ?? '').trim(),
      content: String(row.content ?? '').trim(),
      rating: typeof row.rating === 'number' ? row.rating : undefined,
      customerRole: row.customerRole?.trim() || undefined,
      title: row.title?.trim() || undefined,
    }))
    .filter((row) => row.customerName && row.content)
}

/** Parallel chrome fetch for classic HomePageSections paths. */
export async function fetchStorefrontCmsChrome(tenantId: string, vertical: string) {
  const [headerNavLinks, footerNavLinks, faqs, testimonials] = await Promise.all([
    fetchStorefrontNavLinks(tenantId, 'header', vertical),
    fetchStorefrontNavLinks(tenantId, 'footer', vertical),
    fetchStorefrontFaqs(tenantId),
    fetchStorefrontTestimonials(tenantId),
  ])
  return { headerNavLinks, footerNavLinks, faqs, testimonials }
}
