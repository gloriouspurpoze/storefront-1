/**
 * Tenant-scoped public API client.
 *
 * - Always passes `x-tenant-id` for backend org scope.
 * - Embeds tenant id in the request URL (`__tenant=`) so Next.js Data Cache
 *   keys never share slider/banner payloads across orgs (headers alone are easy
 *   to misconfigure; tags only invalidate, they do not uniquify the key).
 * - Server-only helpers use `fetch` with cache tags so RSC pages auto-revalidate
 *   when the admin saves CMS content (`/api/revalidate` webhook).
 * - Client-only helpers (lead submit) don't get cached.
 */
import { env } from './env'
import { filterOwnedByTenant } from './storefrontContent'
import { withTenantId } from './tenant-headers'

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

/** Append a cache-key-only tenant marker; backend ignores unknown query params. */
function withTenantCacheKey(path: string, tenantId: string): string {
  const id = tenantId.trim()
  if (!id) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}__tenant=${encodeURIComponent(id)}`
}

async function getJson<T>(
  path: string,
  tenantId: string,
  opts: { revalidate?: number; tags?: string[] } = {},
): Promise<T | null> {
  if (!tenantId) return null
  try {
    const res = await fetch(apiUrl(withTenantCacheKey(path, tenantId)), {
      method: 'GET',
      headers: withTenantId(tenantId, { Accept: 'application/json' }),
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
    headers: withTenantId(tenantId, {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
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
  inStock?: boolean
  hasVariants?: boolean
  variants?: PublicProductVariant[]
}

export function isMenuItemInStock(item: Pick<PublicMenuItem, 'inStock'>): boolean {
  return item.inStock !== false
}

export interface PublicMenuCategory {
  id: string
  name: string
  /** Catalog slug — matches CMS `category-marketing` keys and `?category=` on `/menu`. */
  slug: string
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

export interface PublicProductVariant {
  id: string
  name: string
  price: number
  originalPrice?: number
  inStock?: boolean
}

export interface PublicProduct {
  id: string
  slug: string
  name: string
  shortDescription?: string
  description?: string
  price: number
  originalPrice?: number
  currency: string
  /** Primary image (list cards, OG, fallback). */
  imageUrl?: string
  /** Full gallery URLs (primary first). Empty/omitted → use `imageUrl` only. */
  imageUrls?: string[]
  inStock: boolean
  hasVariants?: boolean
  variants?: PublicProductVariant[]
  /** Assigned admin category — drives Brown Butter section grouping. */
  categorySlug?: string
  categoryName?: string
  categorySortOrder?: number
}

/** Resolve PDP gallery URLs — prefers `imageUrls`, falls back to single `imageUrl`. */
export function resolveProductGalleryUrls(
  product: Pick<PublicProduct, 'imageUrl' | 'imageUrls'>,
): string[] {
  const fromGallery = Array.isArray(product.imageUrls)
    ? product.imageUrls.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    : []
  if (fromGallery.length > 0) {
    const seen = new Set<string>()
    const out: string[] = []
    for (const url of fromGallery) {
      if (seen.has(url)) continue
      seen.add(url)
      out.push(url)
    }
    return out
  }
  return product.imageUrl ? [product.imageUrl] : []
}

export interface StorefrontProductCategory {
  slug: string
  name: string
  sortOrder?: number
}

export async function fetchStorefrontCategories(
  tenantId: string,
): Promise<StorefrontProductCategory[]> {
  const data = await getJson<{ categories: StorefrontProductCategory[] }>(
    '/public/storefront/categories',
    tenantId,
    { revalidate: 60, tags: [`tenant:${tenantId}`, `tenant:${tenantId}:categories`] },
  )
  return data?.categories ?? []
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
  orderNumber?: string
  orderId?: string
}

export interface StorefrontShippingAddressPayload {
  firstName: string
  lastName: string
  address: string
  city: string
  state?: string
  zipCode: string
  pincode?: string
  country: string
  phone?: string
  email?: string
}

export async function createCheckoutOrder(input: {
  tenantId: string
  items: Array<{ productId: string; quantity: number; variantId?: string }>
  customerEmail: string
  customerName?: string
  notes?: string
  accessToken?: string
}): Promise<CheckoutOrderResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (input.accessToken) headers.Authorization = `Bearer ${input.accessToken}`

  const res = await fetch(apiUrl('/public/storefront/checkout/create-order'), {
    method: 'POST',
    headers: withTenantId(input.tenantId, headers),
    body: JSON.stringify({
      items: input.items,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      notes: input.notes,
    }),
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<CheckoutOrderResult> | null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || `Checkout failed (${res.status})`)
  }
  return json.data
}

export type StorefrontOfflinePaymentMethod = 'cod' | 'pay_at_restaurant'

export async function placeCheckoutOrder(input: {
  tenantId: string
  items: Array<{ productId: string; quantity: number; variantId?: string }>
  customerEmail: string
  customerName?: string
  notes?: string
  phone?: string
  paymentMethod: StorefrontOfflinePaymentMethod
  shippingAddress?: StorefrontShippingAddressPayload
  accessToken?: string
}): Promise<CheckoutVerifyResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (input.accessToken) headers.Authorization = `Bearer ${input.accessToken}`

  const res = await fetch(apiUrl('/public/storefront/checkout/place-order'), {
    method: 'POST',
    headers: withTenantId(input.tenantId, headers),
    body: JSON.stringify({
      items: input.items,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      notes: input.notes,
      phone: input.phone,
      paymentMethod: input.paymentMethod,
      shippingAddress: input.shippingAddress,
    }),
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<CheckoutVerifyResult> | null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || `Order placement failed (${res.status})`)
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

export interface StorefrontTemplateCheckoutSettings {
  showPreferredDateOfDelivery?: boolean
  showPreferredTimeOfDelivery?: boolean
}

export interface StorefrontOrderingDayHours {
  closed: boolean
  openTime?: string
  closeTime?: string
}

export interface StorefrontOrderingAvailability {
  earliestDate?: string
  latestDate?: string
  slotsNote?: string
}

export interface StorefrontShippingPolicyZone {
  label: string
  details: string
  fee?: string
}

export interface StorefrontShippingPolicy {
  summary?: string
  body?: string
  processingNote?: string
  zones?: StorefrontShippingPolicyZone[]
}

export type StorefrontTemplateSettings = Record<string, StorefrontTemplateCheckoutSettings>

export interface StorefrontConfig {
  tenantId: string
  themeKey?: string
  sections?: StorefrontSection[]
  content?: StorefrontContent
  templateSettings?: StorefrontTemplateSettings
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
  orderingHours?: Partial<import('@/lib/orderingHours').OrderingHoursConfig>
  orderingAvailability?: import('@/lib/orderingHours').OrderingAvailabilityConfig
  shippingPolicy?: import('@/lib/shippingPolicy').ShippingPolicyConfig
}

export async function fetchStorefrontConfig(tenantId: string): Promise<StorefrontConfig | null> {
  // Backend returns { tenant, config } since the config endpoint was enhanced to
  // include tenant identity. Unwrap `config` and normalise required sub-objects so
  // callers never have to guard against missing `branding` / `seo` objects.
  const raw = await getJson<{ tenant: unknown; config: StorefrontConfig }>(
    '/public/storefront/config',
    tenantId,
    { revalidate: 60, tags: [`tenant:${tenantId}`, `tenant:${tenantId}:config`] },
  )
  if (!raw) return null
  const cfg = raw.config ?? (raw as unknown as StorefrontConfig)
  return {
    ...cfg,
    branding: cfg.branding ?? {},
    seo: cfg.seo ?? {},
    featureFlags: cfg.featureFlags ?? {},
  }
}

export async function verifyCheckout(input: {
  tenantId: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  customerEmail: string
  customerName?: string
  phone?: string
  shippingAddress?: StorefrontShippingAddressPayload
  accessToken?: string
}): Promise<CheckoutVerifyResult> {
  const { tenantId, accessToken, shippingAddress, ...body } = input
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const res = await fetch(apiUrl('/public/storefront/checkout/verify'), {
    method: 'POST',
    headers: withTenantId(tenantId, headers),
    body: JSON.stringify({ ...body, shippingAddress }),
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

// ——— Customer account (authenticated) ———

export interface CustomerOrderSummary {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  itemCount: number
  items: Array<{ name: string; quantity: number; price: number; total: number }>
  trackingNumber?: string
  carrier?: string
  trackingUrl?: string | null
  shippedAt?: string
  deliveredAt?: string
  createdAt?: string
}

export interface CustomerProfile {
  id: string
  firstName: string
  lastName?: string
  email: string
  phone?: string
  profilePicture?: string
  userType: string
}

/** Saved delivery address from GET/POST/PUT `/addresses`. */
export interface CustomerSavedAddress {
  _id: string
  type?: 'home' | 'work' | 'other'
  label?: string
  street: string
  apartment?: string
  landmark?: string
  city: string
  state: string
  zipCode: string
  country?: string
  isDefault?: boolean
}

export type UpdateCustomerProfileInput = {
  accessToken: string
  firstName: string
  lastName?: string
  /** E.164 (e.g. +9198…) — omit to leave unchanged */
  phone?: string
}

function mapAuthProfileUser(
  raw: Record<string, unknown> | null | undefined,
): {
  id: string
  email: string
  phone?: string
  firstName: string
  lastName?: string
  profilePicture?: string
  userType: string
} | null {
  if (!raw || typeof raw !== 'object') return null
  const id = String(raw.id ?? '')
  if (!id) return null
  const firstName = String(raw.firstName ?? raw.first_name ?? '').trim()
  const lastNameRaw = raw.lastName ?? raw.last_name
  const lastName =
    lastNameRaw === undefined || lastNameRaw === null
      ? undefined
      : String(lastNameRaw).trim() || undefined
  return {
    id,
    email: String(raw.email ?? ''),
    phone: raw.phone != null ? String(raw.phone) : undefined,
    firstName: firstName || 'Customer',
    lastName,
    profilePicture:
      raw.profilePicture != null
        ? String(raw.profilePicture)
        : raw.profile_picture != null
          ? String(raw.profile_picture)
          : undefined,
    userType: String(raw.userType ?? raw.user_type ?? 'customer'),
  }
}

/**
 * Persist name/phone via existing auth profile API (customer JWT).
 * @see PATCH /api/auth/profile
 */
export async function updateCustomerProfile(
  input: UpdateCustomerProfileInput,
): Promise<{
  id: string
  email: string
  phone?: string
  firstName: string
  lastName?: string
  profilePicture?: string
  userType: string
}> {
  const body: Record<string, string> = {
    firstName: input.firstName.trim(),
  }
  if (input.lastName !== undefined) body.lastName = input.lastName.trim()
  if (input.phone !== undefined) body.phone = input.phone

  const res = await fetch(apiUrl('/auth/profile'), {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as {
    success?: boolean
    message?: string
    data?: { user?: Record<string, unknown>; message?: string } | Record<string, unknown>
  } | null
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `Failed to update profile (${res.status})`)
  }
  const payload = json.data
  const rawUser =
    payload && typeof payload === 'object' && 'user' in payload
      ? (payload.user as Record<string, unknown>)
      : (payload as Record<string, unknown> | undefined)
  const mapped = mapAuthProfileUser(rawUser)
  if (!mapped) throw new Error(json.message || 'Profile update returned no user')
  return mapped
}

/** @see GET /api/addresses/default */
export async function fetchCustomerDefaultAddress(input: {
  accessToken: string
}): Promise<CustomerSavedAddress | null> {
  const res = await fetch(apiUrl('/addresses/default'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${input.accessToken}`,
    },
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as {
    success?: boolean
    message?: string
    data?: { address?: CustomerSavedAddress | null }
  } | null
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `Failed to load address (${res.status})`)
  }
  const addr = json.data?.address
  if (!addr || !addr.street) return null
  return {
    ...addr,
    _id: String((addr as { _id?: string; id?: string })._id ?? (addr as { id?: string }).id ?? ''),
  }
}

/** Create or update the customer's default delivery address. */
export async function saveCustomerAddress(input: {
  accessToken: string
  addressId?: string | null
  street: string
  apartment?: string
  city: string
  state: string
  zipCode: string
  country?: string
}): Promise<CustomerSavedAddress> {
  const body = {
    type: 'home' as const,
    street: input.street.trim(),
    apartment: input.apartment?.trim() || '',
    city: input.city.trim(),
    state: input.state.trim(),
    zipCode: input.zipCode.trim(),
    country: input.country?.trim() || 'India',
    isDefault: true,
  }

  const updating = Boolean(input.addressId?.trim())
  const path = updating
    ? `/addresses/${encodeURIComponent(input.addressId!.trim())}`
    : '/addresses'
  const res = await fetch(apiUrl(path), {
    method: updating ? 'PUT' : 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as {
    success?: boolean
    message?: string
    data?: { address?: CustomerSavedAddress }
  } | null
  if (!res.ok || !json?.success || !json.data?.address) {
    throw new Error(json?.message || `Failed to save address (${res.status})`)
  }
  const addr = json.data.address
  return {
    ...addr,
    _id: String((addr as { _id?: string; id?: string })._id ?? (addr as { id?: string }).id ?? ''),
  }
}

export async function fetchCustomerOrders(input: {
  tenantId: string
  accessToken: string
  page?: number
  limit?: number
}): Promise<{ orders: CustomerOrderSummary[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams()
  if (input.page) params.set('page', String(input.page))
  if (input.limit) params.set('limit', String(input.limit))
  const qs = params.toString()

  const res = await fetch(
    apiUrl(`/public/storefront/customers/orders${qs ? `?${qs}` : ''}`),
    {
      method: 'GET',
      headers: withTenantId(input.tenantId, {
        Accept: 'application/json',
        Authorization: `Bearer ${input.accessToken}`,
      }),
      cache: 'no-store',
    },
  )
  const json = (await res.json().catch(() => null)) as {
    success?: boolean
    message?: string
    data?: {
      orders: CustomerOrderSummary[]
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }
  } | null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || `Failed to load orders (${res.status})`)
  }
  return json.data
}

export async function fetchCustomerProfile(input: {
  tenantId: string
  accessToken: string
}): Promise<CustomerProfile | null> {
  const res = await fetch(apiUrl('/public/storefront/customers/me'), {
    method: 'GET',
    headers: withTenantId(input.tenantId, {
      Accept: 'application/json',
      Authorization: `Bearer ${input.accessToken}`,
    }),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as {
    success?: boolean
    data?: CustomerProfile
  } | null
  if (!res.ok || !json?.success || !json.data) return null
  return json.data
}

export async function fetchCustomerOrderTracking(input: {
  tenantId: string
  accessToken: string
  orderNumber: string
}): Promise<PublicOrderTracking | null> {
  const encoded = encodeURIComponent(input.orderNumber.trim())
  const res = await fetch(apiUrl(`/public/storefront/customers/orders/${encoded}/track`), {
    method: 'GET',
    headers: withTenantId(input.tenantId, {
      Accept: 'application/json',
      Authorization: `Bearer ${input.accessToken}`,
    }),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<PublicOrderTracking> | null
  if (res.status === 404) return null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || `Failed to track order (${res.status})`)
  }
  return json.data
}

export async function fetchPublicOrderTracking(input: {
  tenantId: string
  orderNumber: string
  email?: string
  phone?: string
}): Promise<PublicOrderTracking | null> {
  const params = new URLSearchParams({ orderNumber: input.orderNumber.trim() })
  if (input.email?.trim()) params.set('email', input.email.trim().toLowerCase())
  if (input.phone?.trim()) params.set('phone', input.phone.trim())
  if (!params.has('email') && !params.has('phone')) {
    throw new Error('orderNumber and email or phone are required')
  }
  const res = await fetch(
    apiUrl(`/public/storefront/orders/track?${params.toString()}`),
    {
      method: 'GET',
      headers: withTenantId(input.tenantId, {
        Accept: 'application/json',
      }),
      cache: 'no-store',
    },
  )
  const json = (await res.json().catch(() => null)) as ApiEnvelope<PublicOrderTracking> | null
  if (res.status === 404) return null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || `Failed to track order (${res.status})`)
  }
  return json.data
}

// ——— Bazaar gift match ———

export interface GiftMatchRecommendation {
  productId: string
  name: string
  slug: string
  priceInr: number
  imageUrl?: string
  reason: string
}

export interface GiftMatchResult {
  explanation: string
  recommendations: GiftMatchRecommendation[]
  providerUsed: 'openai' | 'gemini'
}

export async function postGiftMatch(input: {
  tenantId: string
  recipient: string
  occasion: string
  budgetMin?: number
  budgetMax?: number
}): Promise<GiftMatchResult> {
  const res = await fetch(apiUrl('/bazaar/store/gift-match'), {
    method: 'POST',
    headers: withTenantId(input.tenantId, {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify({
      recipient: input.recipient,
      occasion: input.occasion,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
    }),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<GiftMatchResult> | null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || 'Gift match request failed')
  }
  return json.data
}

// ——— Sliders & banners (tenant storefront home) ———

export type StorefrontSliderMediaType = 'image' | 'video' | 'gif' | 'lottie'

export interface StorefrontSliderPlayback {
  autoplay: boolean
  loop: boolean
  muted: boolean
  playsInline: boolean
}

export interface StorefrontSlider {
  id: string
  tenantId?: string
  title: string
  subtitle?: string
  description?: string
  image_url: string
  image_url_mobile?: string
  image_alt?: string
  media_type?: StorefrontSliderMediaType
  video_url?: string
  video_url_mobile?: string
  poster_url?: string
  poster_url_mobile?: string
  lottie_url?: string
  playback?: StorefrontSliderPlayback
  button_text?: string
  button_url?: string
  position: number
  is_active: boolean
  placement?: string
  category_id?: string
  category_slug?: string
  category_name?: string
  product_id?: string
  product_slug?: string
  product_name?: string
  start_date?: string
  end_date?: string
  target_audience?: 'all' | 'customers' | 'providers'
}

export interface StorefrontBanner {
  id: string
  tenantId?: string
  title: string
  description?: string
  bannerType: string
  position: string
  images: { desktop: string; mobile?: string; poster?: string; posterMobile?: string }
  mediaType?: StorefrontSliderMediaType
  video?: { desktop?: string; mobile?: string }
  lottieUrl?: string
  playback?: StorefrontSliderPlayback
  cta?: { text: string; link: string; openInNewTab?: boolean }
  schedule?: { startDate: string; endDate: string; timezone?: string }
  priority?: number
  productId?: string
  productSlug?: string
  productName?: string
  settings?: Record<string, unknown>
}

export interface StorefrontAnnouncement {
  enabled: boolean
  banner: {
    title: string
    description?: string
    ctaText?: string
    ctaUrl?: string
    schedule?: { startDate: string; endDate: string; timezone?: string }
  } | null
}

export async function fetchStorefrontSliders(
  tenantId: string,
  query?: {
    placement?: string
    platform?: 'web' | 'mobile'
    category_slug?: string
    product_slug?: string
  },
): Promise<StorefrontSlider[]> {
  const params = new URLSearchParams()
  if (query?.placement) params.set('placement', query.placement)
  if (query?.platform) params.set('platform', query.platform)
  if (query?.category_slug) params.set('category_slug', query.category_slug)
  if (query?.product_slug) params.set('product_slug', query.product_slug)
  const qs = params.toString()
  const data = await getJson<{ sliders: StorefrontSlider[] }>(
    `/public/storefront/sliders${qs ? `?${qs}` : ''}`,
    tenantId,
    {
      revalidate: 120,
      tags: [`tenant:${tenantId}`, `tenant:${tenantId}:sliders`, `tenant:${tenantId}:sliders:${query?.placement ?? 'all'}`],
    },
  )
  return filterOwnedByTenant(data?.sliders ?? [], tenantId)
}

export async function fetchStorefrontBanners(
  tenantId: string,
  query?: { bannerType?: string; position?: string },
): Promise<StorefrontBanner[]> {
  const params = new URLSearchParams()
  if (query?.bannerType) params.set('bannerType', query.bannerType)
  if (query?.position) params.set('position', query.position)
  const qs = params.toString()
  const data = await getJson<{ banners: StorefrontBanner[] }>(
    `/public/storefront/banners${qs ? `?${qs}` : ''}`,
    tenantId,
    {
      revalidate: 120,
      tags: [`tenant:${tenantId}`, `tenant:${tenantId}:banners`],
    },
  )
  return filterOwnedByTenant(data?.banners ?? [], tenantId)
}

export async function fetchStorefrontAnnouncement(
  tenantId: string,
): Promise<StorefrontAnnouncement | null> {
  return getJson<StorefrontAnnouncement>('/public/storefront/announcement', tenantId, {
    revalidate: 60,
    tags: [`tenant:${tenantId}`, `tenant:${tenantId}:announcement`],
  })
}

/** Tenant-scoped CMS `category-marketing` JSON keyed by catalog slug (e.g. `beverages`). */
export async function fetchCategoryMarketing(
  tenantId: string,
): Promise<Record<string, unknown>> {
  const data = await getJson<Record<string, unknown>>(
    '/cms/static-content/category-marketing',
    tenantId,
    {
      revalidate: 300,
      tags: [`tenant:${tenantId}`, `tenant:${tenantId}:category-marketing`],
    },
  )
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
}
