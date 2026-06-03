/**
 * Tenant-scoped public API client.
 *
 * - Always passes `x-tenant-id` so the backend can scope without exposing it
 *   in the URL (cleaner cache keys, friendlier logs).
 * - Server-only helpers use `fetch` with cache tags so RSC pages auto-revalidate
 *   when the admin saves CMS content (`/api/revalidate` webhook).
 * - Client-only helpers (lead submit) don't get cached.
 */
import { env } from './env'

export interface PublicService {
  id: string
  slug: string
  name: string
  shortDescription?: string
  description?: string
  imageUrl?: string
  basePrice?: number
  currency?: string
  durationMinutes?: number
  rating?: number
  reviewCount?: number
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
}

function apiUrl(path: string): string {
  return `${env.API_BASE_URL.replace(/\/+$/, '')}${path}`
}

async function getJson<T>(
  path: string,
  tenantId: string,
  opts: { revalidate?: number; tags?: string[] } = {},
): Promise<T | null> {
  if (!tenantId) return null
  try {
    const res = await fetch(apiUrl(path), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-tenant-id': tenantId,
      },
      next: {
        revalidate: opts.revalidate ?? 60,
        tags: opts.tags ?? [`tenant:${tenantId}`],
      },
    })
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
    return json?.success ? (json.data ?? null) : null
  } catch {
    return null
  }
}

export async function fetchServices(
  tenantId: string,
  limit = 24,
): Promise<PublicService[]> {
  const data = await getJson<{ services: PublicService[] }>(
    `/public/storefront/services?limit=${limit}`,
    tenantId,
    { revalidate: 120, tags: [`tenant:${tenantId}`, `tenant:${tenantId}:services`] },
  )
  return data?.services ?? []
}

export async function fetchServiceBySlug(
  tenantId: string,
  slug: string,
): Promise<PublicService | null> {
  if (!slug) return null
  return getJson<PublicService>(
    `/public/storefront/services/${encodeURIComponent(slug)}`,
    tenantId,
    {
      revalidate: 120,
      tags: [
        `tenant:${tenantId}`,
        `tenant:${tenantId}:services`,
        `tenant:${tenantId}:service:${slug}`,
      ],
    },
  )
}

export interface LeadInput {
  tenantId: string
  firstName: string
  lastName?: string
  email: string
  phone?: string
  message?: string
  source?: string
  serviceSlug?: string
  locality?: string
}

export interface LeadResult {
  id: string
  deduped: boolean
}

export async function submitLead(input: LeadInput): Promise<LeadResult> {
  const { tenantId, ...body } = input
  const res = await fetch(apiUrl('/public/storefront/leads'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-tenant-id': tenantId,
    },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<LeadResult> | null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || `Submit failed (${res.status})`)
  }
  return json.data
}

// ——— Restaurant (Phase 2) ———

export interface PublicMenuItem {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  imageUrl?: string
  dietary?: string[]
}

export interface PublicMenuCategory {
  id: string
  name: string
  items: PublicMenuItem[]
}

export async function fetchMenu(tenantId: string): Promise<PublicMenuCategory[]> {
  const data = await getJson<{ categories: PublicMenuCategory[] }>(
    '/public/storefront/menu',
    tenantId,
    { revalidate: 120, tags: [`tenant:${tenantId}`, `tenant:${tenantId}:menu`] },
  )
  return data?.categories ?? []
}

// ——— Retail (Phase 3) ———

export interface PublicProduct {
  id: string
  slug: string
  name: string
  shortDescription?: string
  description?: string
  price: number
  originalPrice?: number
  currency: string
  imageUrl?: string
  inStock: boolean
}

export async function fetchProducts(tenantId: string, limit = 24): Promise<PublicProduct[]> {
  const data = await getJson<{ products: PublicProduct[] }>(
    `/public/storefront/products?limit=${limit}`,
    tenantId,
    { revalidate: 120, tags: [`tenant:${tenantId}`, `tenant:${tenantId}:products`] },
  )
  return data?.products ?? []
}

export async function fetchProductBySlug(
  tenantId: string,
  slug: string,
): Promise<PublicProduct | null> {
  if (!slug) return null
  return getJson<PublicProduct>(
    `/public/storefront/products/${encodeURIComponent(slug)}`,
    tenantId,
    {
      revalidate: 120,
      tags: [
        `tenant:${tenantId}`,
        `tenant:${tenantId}:products`,
        `tenant:${tenantId}:product:${slug}`,
      ],
    },
  )
}

export interface CheckoutOrderResult {
  orderId: string
  amountPaise: number
  currency: 'INR'
  keyId: string
  tenantId: string
}

export interface CheckoutVerifyResult {
  verified: true
  contactId: string
}

export async function createCheckoutOrder(input: {
  tenantId: string
  items: Array<{ productId: string; quantity: number }>
  customerEmail?: string
  customerName?: string
}): Promise<CheckoutOrderResult> {
  const res = await fetch(apiUrl('/public/storefront/checkout/create-order'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-tenant-id': input.tenantId,
    },
    body: JSON.stringify({
      items: input.items,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
    }),
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<CheckoutOrderResult> | null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || `Checkout failed (${res.status})`)
  }
  return json.data
}

// ——— Storefront Studio (per-tenant config: branding, SEO, flags) ———

export interface StorefrontConfigSeoRobots {
  indexable: boolean
  followLinks: boolean
  noArchive?: boolean
  noSnippet?: boolean
}

export interface StorefrontSection {
  id: string
  type: string
  enabled: boolean
  order: number
}

export interface StorefrontContent {
  heroHeadline?: string
  heroSubcopy?: string
  aboutTitle?: string
  aboutBody?: string
  faqItems?: Array<{ question: string; answer: string }>
}

export interface StorefrontConfig {
  tenantId: string
  themeKey?: string
  sections?: StorefrontSection[]
  content?: StorefrontContent
  branding: {
    siteName?: string
    tagline?: string
    logoUrl?: string
    faviconUrl?: string
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    fontHeading?: string
    fontBody?: string
    contactEmail?: string
    contactPhone?: string
    address?: string
    socials?: Record<string, string>
  }
  seo: {
    titleTemplate?: string
    defaultTitle?: string
    defaultDescription?: string
    defaultKeywords?: string[]
    ogImageUrl?: string
    twitterHandle?: string
    canonicalDomain?: string
    robots?: StorefrontConfigSeoRobots
    sitemapEnabled?: boolean
    rssEnabled?: boolean
    structuredData?: Record<string, boolean>
    analytics?: {
      googleAnalyticsId?: string
      googleTagManagerId?: string
      metaPixelId?: string
      hotjarId?: string
      clarityId?: string
      googleSiteVerification?: string
    }
    pages?: Record<string, { title?: string; description?: string; ogImageUrl?: string; noindex?: boolean }>
  }
  featureFlags: Record<string, boolean | Record<string, boolean> | undefined>
  featureAddons?: Record<string, { sku: string; purchased?: boolean }>
  customCss?: string
}

export async function fetchStorefrontConfig(tenantId: string): Promise<StorefrontConfig | null> {
  return getJson<StorefrontConfig>('/public/storefront/config', tenantId, {
    revalidate: 60,
    tags: [`tenant:${tenantId}`, `tenant:${tenantId}:config`],
  })
}

export async function verifyCheckout(input: {
  tenantId: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  customerEmail: string
  customerName?: string
  phone?: string
}): Promise<CheckoutVerifyResult> {
  const { tenantId, ...body } = input
  const res = await fetch(apiUrl('/public/storefront/checkout/verify'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-tenant-id': tenantId,
    },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<CheckoutVerifyResult> | null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || `Verification failed (${res.status})`)
  }
  return json.data
}

export interface PublicOrderTracking {
  orderNumber: string
  status: string
  carrier?: string
  carrierLabel?: string
  trackingNumber?: string
  trackingUrl?: string | null
  shippedAt?: string
  deliveredAt?: string
  estimatedDeliveryAt?: string
  createdAt?: string
  statusHistory?: Array<{ status: string; at: string; note?: string }>
}

export async function fetchPublicOrderTracking(input: {
  tenantId: string
  orderNumber: string
  email: string
}): Promise<PublicOrderTracking | null> {
  const params = new URLSearchParams({
    orderNumber: input.orderNumber.trim(),
    email: input.email.trim().toLowerCase(),
  })
  const res = await fetch(
    apiUrl(`/public/storefront/orders/track?${params.toString()}`),
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-tenant-id': input.tenantId,
      },
      cache: 'no-store',
    },
  )
  const json = (await res.json().catch(() => null)) as ApiEnvelope<PublicOrderTracking> | null
  if (!res.ok || !json?.success || !json.data) return null
  return json.data
}
