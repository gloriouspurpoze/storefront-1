/**
 * Multi-vendor marketplace API client (`/public/marketplace/*`).
 *
 * Server helpers (search, seller store, directory) go through the Next Data Cache with a
 * tenant cache key; client helpers (quote, checkout, applications, buyer orders) never cache.
 * Themes import from here — no theme-local API clients (THEME_BRIEF `forbiddenPatterns`).
 */
import { env } from './env'
import { withTenantId } from './tenant-headers'
import { openRazorpayCheckout } from './razorpayCheckout'
import type { PublicProduct } from './storefront-api'
import type { StorefrontShippingAddressPayload } from './storefrontShippingAddress'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PublicSeller {
  id: string
  slug: string
  displayName: string
  sellerType?: 'platform' | 'business' | 'individual'
  logoUrl?: string
  bannerUrl?: string
  tagline?: string
  bio?: string
  location?: { city?: string; state?: string }
  website?: string
  socialLinks?: Partial<Record<'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube', string>>
  featured: boolean
  rating: number
  reviewCount: number
  policies?: { shippingPolicy?: string; returnPolicy?: string }
  memberSince?: string
  listingCount?: number
}

export type MarketplaceListingType = 'product' | 'service' | 'bazaar'

/** Normalized listing card — what grids render. */
export interface MarketplaceListingCard {
  /** MarketplaceListing id — the cart / checkout key. */
  listingId: string
  title: string
  /** Product slug for `/products/[slug]`; null for listings without a product page. */
  productSlug: string | null
  /** Catalog product id (wishlist key); null for listings without a product. */
  productId: string | null
  /** Product has option variants — buy from the PDP, not quick add. */
  hasVariants: boolean
  /** Product review aggregate (verified-purchase reviews). */
  rating: number
  reviewCount: number
  listingType: MarketplaceListingType
  priceInr: number
  compareAtPriceInr?: number
  imageUrl?: string
  inStock: boolean
  seller: { slug: string; name: string; rating: number; reviewCount: number; logoUrl?: string }
}

export interface MarketplaceFacets {
  categories: Array<{ id: string; name: string; slug: string; count: number }>
  priceRange: { min: number; max: number }
  sellers: Array<{ id: string; name: string; slug: string; count: number }>
}

export interface MarketplacePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type MarketplaceSort = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating'

export const MARKETPLACE_SORTS: Array<{ value: MarketplaceSort; label: string }> = [
  { value: 'relevance', label: 'Recommended' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

export interface MarketplaceListingQuery {
  q?: string
  /** Category URL slug. */
  category?: string
  minPrice?: number
  maxPrice?: number
  sort?: MarketplaceSort
  page?: number
  limit?: number
  types?: MarketplaceListingType[]
  sellerSlug?: string
  facets?: boolean
}

export interface MarketplaceListingPage {
  listings: MarketplaceListingCard[]
  pagination: MarketplacePagination
  facets?: MarketplaceFacets
}

export interface MarketplaceQuoteGroup {
  sellerId: string
  sellerName: string
  sellerSlug: string
  subtotalInr: number
  shippingInr: number
}

export interface MarketplaceQuote {
  subtotalInr: number
  shippingInr: number
  totalInr: number
  requiresShipping: boolean
  sellerGroups: MarketplaceQuoteGroup[]
}

export interface CustomerSubOrder {
  subOrderNumber: string
  status: string
  listingType: MarketplaceListingType
  totalInr: number
  shippingInr: number
  trackingNumber?: string
  carrier?: string
  updatedAt?: string
  seller: { name: string; slug: string; logoUrl?: string }
  /** Delivered / completed — items can be reviewed. */
  canReview?: boolean
  items: Array<{
    listingId?: string
    title: string
    variantName?: string
    quantity: number
    unitPriceInr: number
    lineTotalInr: number
    reviewed?: boolean
  }>
}

export interface CustomerCheckout {
  checkoutNumber: string
  paymentStatus: string
  totalInr: number
  shippingInr: number
  createdAt: string
  shippingAddress?: {
    name?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    phone?: string
  }
  subOrders: CustomerSubOrder[]
}

export interface MarketplaceCheckoutLine {
  listingId: string
  quantity: number
  variantId?: string
  metadata?: Record<string, unknown>
}

export interface MarketplaceCheckoutCustomer {
  email: string
  name?: string
  phone?: string
}

// ─── Transport ──────────────────────────────────────────────────────────────

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
}

function apiUrl(path: string): string {
  return `${env.API_BASE_URL.replace(/\/+$/, '')}${path}`
}

/** Cached GET for RSC pages. The `__tenant` marker keeps Data Cache keys per tenant. */
async function getCached<T>(path: string, tenantId: string, revalidate = 60): Promise<T | null> {
  if (!tenantId) return null
  const sep = path.includes('?') ? '&' : '?'
  try {
    const res = await fetch(apiUrl(`${path}${sep}__tenant=${encodeURIComponent(tenantId)}`), {
      headers: withTenantId(tenantId, { Accept: 'application/json' }),
      next: { revalidate, tags: [`tenant:${tenantId}`, `tenant:${tenantId}:marketplace`] },
    })
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
    return json?.success ? (json.data ?? null) : null
  } catch {
    return null
  }
}

async function send<T>(
  path: string,
  tenantId: string,
  init: { method?: 'GET' | 'POST'; body?: unknown; accessToken?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (init.body !== undefined) headers['Content-Type'] = 'application/json'
  if (init.accessToken) headers.Authorization = `Bearer ${init.accessToken}`
  const res = await fetch(apiUrl(path), {
    method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
    headers: withTenantId(tenantId, headers),
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!res.ok || !json?.success || json.data === undefined) {
    throw new Error(json?.message || `Request failed (${res.status})`)
  }
  return json.data
}

// ─── Normalizers ────────────────────────────────────────────────────────────

type RawListing = {
  _id?: string
  title?: string
  listingType?: MarketplaceListingType
  priceInr?: number
  compareAtPriceInr?: number
  productDetails?: {
    images?: string[]
    stockQty?: number
    productId?: { _id?: string; slug?: string; hasVariants?: boolean; averageRating?: number; totalReviews?: number } | string | null
  }
  sellerId?: { slug?: string; displayName?: string; rating?: number; reviewCount?: number; logoUrl?: string } | string
}

export function normalizeListing(raw: RawListing): MarketplaceListingCard {
  const seller = raw.sellerId && typeof raw.sellerId === 'object' ? raw.sellerId : {}
  const product = raw.productDetails?.productId
  const populated = product && typeof product === 'object' ? product : null
  const stock = raw.productDetails?.stockQty
  return {
    listingId: String(raw._id ?? ''),
    title: raw.title ?? 'Untitled',
    productSlug: populated?.slug ?? null,
    productId: populated?._id ? String(populated._id) : typeof product === 'string' ? product : null,
    hasVariants: populated?.hasVariants === true,
    rating: Number(populated?.averageRating ?? 0),
    reviewCount: Number(populated?.totalReviews ?? 0),
    listingType: raw.listingType ?? 'product',
    priceInr: Number(raw.priceInr ?? 0),
    compareAtPriceInr:
      raw.compareAtPriceInr && raw.compareAtPriceInr > Number(raw.priceInr ?? 0) ? raw.compareAtPriceInr : undefined,
    imageUrl: raw.productDetails?.images?.find((u) => typeof u === 'string' && u.trim()) ?? undefined,
    inStock: typeof stock === 'number' ? stock > 0 : true,
    seller: {
      slug: seller.slug ?? '',
      name: seller.displayName ?? 'Seller',
      rating: Number(seller.rating ?? 0),
      reviewCount: Number(seller.reviewCount ?? 0),
      logoUrl: seller.logoUrl,
    },
  }
}

/** Catalog product (with marketplace seller fields) → listing card. Null when not listed. */
export function listingCardFromProduct(p: PublicProduct): MarketplaceListingCard | null {
  if (!p.listingId || !p.sellerSlug) return null
  return {
    listingId: p.listingId,
    title: p.name,
    productSlug: p.slug,
    productId: p.id,
    hasVariants: Boolean(p.hasVariants && p.variants?.length),
    rating: p.averageRating ?? 0,
    reviewCount: p.totalReviews ?? 0,
    listingType: 'product',
    priceInr: p.price,
    compareAtPriceInr: p.originalPrice && p.originalPrice > p.price ? p.originalPrice : undefined,
    imageUrl: p.imageUrl,
    inStock: p.inStock,
    seller: { slug: p.sellerSlug, name: p.sellerName ?? 'Seller', rating: 0, reviewCount: 0 },
  }
}

/** Query string for `/public/marketplace/search` and the seller store endpoint. */
export function listingQueryString(q: MarketplaceListingQuery): string {
  const params = new URLSearchParams()
  if (q.q?.trim()) params.set('q', q.q.trim())
  if (q.category) params.set('category', q.category)
  if (q.minPrice && q.minPrice > 0) params.set('minPrice', String(q.minPrice))
  if (q.maxPrice && q.maxPrice > 0) params.set('maxPrice', String(q.maxPrice))
  if (q.sort && q.sort !== 'relevance') params.set('sort', q.sort)
  if (q.page && q.page > 1) params.set('page', String(q.page))
  if (q.limit) params.set('limit', String(q.limit))
  if (q.types?.length) params.set('types', q.types.join(','))
  if (q.sellerSlug) params.set('sellerSlug', q.sellerSlug)
  if (q.facets) params.set('facets', '1')
  return params.toString()
}

type RawListingPage = { listings?: RawListing[]; pagination?: MarketplacePagination; facets?: MarketplaceFacets }

function toListingPage(data: RawListingPage | null): MarketplaceListingPage {
  return {
    listings: (data?.listings ?? []).map(normalizeListing),
    pagination: data?.pagination ?? { page: 1, limit: 24, total: 0, totalPages: 0 },
    facets: data?.facets,
  }
}

// ─── Browse (server) ────────────────────────────────────────────────────────

export async function searchMarketplace(
  tenantId: string,
  query: MarketplaceListingQuery,
): Promise<MarketplaceListingPage> {
  const qs = listingQueryString({ types: ['product'], ...query })
  const data = await getCached<RawListingPage>(`/public/marketplace/search?${qs}`, tenantId, query.q ? 30 : 60)
  return toListingPage(data)
}

export async function fetchSellerStore(
  tenantId: string,
  sellerSlug: string,
  query: MarketplaceListingQuery = {},
): Promise<(MarketplaceListingPage & { seller: PublicSeller }) | null> {
  const qs = listingQueryString({ types: ['product'], ...query })
  const data = await getCached<RawListingPage & { seller: PublicSeller }>(
    `/public/marketplace/sellers/${encodeURIComponent(sellerSlug)}${qs ? `?${qs}` : ''}`,
    tenantId,
  )
  if (!data?.seller) return null
  return { seller: data.seller, ...toListingPage(data) }
}

export async function fetchSellers(
  tenantId: string,
  query: { q?: string; featured?: boolean; page?: number; limit?: number } = {},
): Promise<{ sellers: PublicSeller[]; pagination: MarketplacePagination }> {
  const params = new URLSearchParams()
  if (query.q?.trim()) params.set('q', query.q.trim())
  if (query.featured) params.set('featured', '1')
  if (query.page && query.page > 1) params.set('page', String(query.page))
  if (query.limit) params.set('limit', String(query.limit))
  const qs = params.toString()
  const data = await getCached<{ sellers: PublicSeller[]; pagination: MarketplacePagination }>(
    `/public/marketplace/sellers${qs ? `?${qs}` : ''}`,
    tenantId,
  )
  return data ?? { sellers: [], pagination: { page: 1, limit: 24, total: 0, totalPages: 0 } }
}

// ─── Checkout (client) ──────────────────────────────────────────────────────

export function quoteMarketplaceCheckout(input: { tenantId: string; lines: MarketplaceCheckoutLine[] }) {
  return send<MarketplaceQuote>('/public/marketplace/checkout/quote', input.tenantId, {
    body: { lines: input.lines },
  })
}

export function createMarketplaceCheckoutOrder(input: {
  tenantId: string
  lines: MarketplaceCheckoutLine[]
  customerEmail: string
  customerName?: string
  phone?: string
  notes?: string
  shippingAddress?: StorefrontShippingAddressPayload
}) {
  const { tenantId, ...body } = input
  return send<{ orderId: string; amountPaise: number; currency: 'INR'; keyId: string; quote: MarketplaceQuote }>(
    '/public/marketplace/checkout/create',
    tenantId,
    { body },
  )
}

export function verifyMarketplaceCheckout(input: {
  tenantId: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  customerEmail: string
  customerName?: string
  phone?: string
  shippingAddress?: StorefrontShippingAddressPayload
}) {
  const { tenantId, ...body } = input
  return send<{
    checkoutNumber: string
    parentCheckoutId: string
    subOrders?: Array<{ subOrderNumber: string; listingType: string; sellerName: string }>
  }>('/public/marketplace/checkout/verify', tenantId, { body })
}

/** Create the Razorpay order, open the payment sheet, then verify — one call from the checkout page. */
export async function runMarketplaceCheckout(input: {
  tenantId: string
  tenantName: string
  brandColor?: string
  lines: MarketplaceCheckoutLine[]
  customer: MarketplaceCheckoutCustomer
  shippingAddress?: StorefrontShippingAddressPayload
  notes?: string
}) {
  if (!input.lines.length) throw new Error('Your cart is empty.')

  const order = await createMarketplaceCheckoutOrder({
    tenantId: input.tenantId,
    lines: input.lines,
    customerEmail: input.customer.email,
    customerName: input.customer.name,
    phone: input.customer.phone,
    notes: input.notes,
    shippingAddress: input.shippingAddress,
  })

  const itemCount = input.lines.reduce((sum, l) => sum + l.quantity, 0)
  const sellerCount = order.quote?.sellerGroups?.length ?? 1
  const payment = await openRazorpayCheckout({
    keyId: order.keyId,
    orderId: order.orderId,
    amountPaise: order.amountPaise,
    currency: order.currency,
    name: input.tenantName,
    description: `${itemCount} item${itemCount === 1 ? '' : 's'} from ${sellerCount} seller${sellerCount === 1 ? '' : 's'}`,
    prefill: { email: input.customer.email, name: input.customer.name, contact: input.customer.phone },
    themeColor: input.brandColor,
  })

  return verifyMarketplaceCheckout({
    tenantId: input.tenantId,
    razorpay_order_id: payment.razorpay_order_id,
    razorpay_payment_id: payment.razorpay_payment_id,
    razorpay_signature: payment.razorpay_signature,
    customerEmail: input.customer.email,
    customerName: input.customer.name,
    phone: input.customer.phone,
    shippingAddress: input.shippingAddress,
  })
}

// ─── Orders (client) ────────────────────────────────────────────────────────

export function fetchCheckoutConfirmation(input: { tenantId: string; checkoutNumber: string; email: string }) {
  return send<CustomerCheckout>(
    `/public/marketplace/checkout/confirmation/${encodeURIComponent(input.checkoutNumber)}?email=${encodeURIComponent(input.email)}`,
    input.tenantId,
  )
}

export function fetchCustomerCheckouts(input: { tenantId: string; accessToken: string; page?: number }) {
  const qs = input.page && input.page > 1 ? `?page=${input.page}` : ''
  return send<{ checkouts: CustomerCheckout[]; pagination: MarketplacePagination }>(
    `/public/marketplace/customers/me/checkouts${qs}`,
    input.tenantId,
    { accessToken: input.accessToken },
  )
}

export function fetchCustomerCheckout(input: { tenantId: string; accessToken: string; checkoutNumber: string }) {
  return send<CustomerCheckout>(
    `/public/marketplace/customers/me/checkouts/${encodeURIComponent(input.checkoutNumber)}`,
    input.tenantId,
    { accessToken: input.accessToken },
  )
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export interface MarketplaceReview {
  id: string
  author: string
  rating: number
  title?: string
  comment?: string
  variantName?: string
  verifiedPurchase: boolean
  createdAt: string
}

export interface MarketplaceReviewPage {
  reviews: MarketplaceReview[]
  summary: { average: number; count: number; distribution: Array<{ stars: number; count: number }> }
  pagination: MarketplacePagination
}

export function fetchReviews(input: { tenantId: string; scope: 'product' | 'seller'; slug: string; page?: number }) {
  const base = input.scope === 'product' ? '/public/marketplace/products' : '/public/marketplace/sellers'
  const qs = input.page && input.page > 1 ? `?page=${input.page}` : ''
  return send<MarketplaceReviewPage>(`${base}/${encodeURIComponent(input.slug)}/reviews${qs}`, input.tenantId)
}

export function submitReview(input: {
  tenantId: string
  accessToken: string
  subOrderNumber: string
  listingId: string
  variantName?: string
  rating: number
  title?: string
  comment?: string
}) {
  const { tenantId, accessToken, ...body } = input
  return send<MarketplaceReview>('/public/marketplace/reviews', tenantId, { body, accessToken })
}

// ─── Sell (client) ──────────────────────────────────────────────────────────

export interface SellerApplicationInput {
  displayName: string
  contactName: string
  email: string
  phone: string
  city?: string
  state?: string
  website?: string
  instagram?: string
  categories?: string[]
  about?: string
  /** Honeypot — must stay empty. */
  company_site?: string
}

export function submitSellerApplication(tenantId: string, input: SellerApplicationInput) {
  return send<{ submitted: true; sellerSlug?: string }>('/public/marketplace/seller-applications', tenantId, {
    body: input,
  })
}
