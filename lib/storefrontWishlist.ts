/**
 * Wishlist add-on (`showWishlist`) — guest storage helpers + API client.
 *
 * Guests: product ids in localStorage (`sf-wishlist:<tenantId>`).
 * Signed-in customers: server-side list (tenant + customer scoped); the guest list is
 * merged into the account on first sign-in and then cleared locally.
 */
import { env } from './env'
import { withTenantId } from './tenant-headers'

export const WISHLIST_MAX_ITEMS = 200
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i

export interface WishlistProduct {
  id: string
  slug: string
  name: string
  price: number
  originalPrice?: number
  currency: string
  imageUrl?: string
  inStock: boolean
  hasVariants: boolean
}

export interface WishlistServerView {
  productIds: string[]
  items: Array<{ productId: string; addedAt: string; product: WishlistProduct }>
}

export class WishlistUnavailableError extends Error {}

export function guestWishlistKey(tenantId: string): string {
  return `sf-wishlist:${tenantId}`
}

export function normalizeWishlistIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of raw) {
    if (typeof v !== 'string' || !OBJECT_ID_RE.test(v.trim())) continue
    const id = v.trim().toLowerCase()
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
    if (out.length >= WISHLIST_MAX_ITEMS) break
  }
  return out
}

export function readGuestWishlist(tenantId: string): string[] {
  if (typeof window === 'undefined' || !tenantId) return []
  try {
    return normalizeWishlistIds(JSON.parse(window.localStorage.getItem(guestWishlistKey(tenantId)) ?? '[]'))
  } catch {
    return []
  }
}

export function writeGuestWishlist(tenantId: string, ids: string[]): void {
  if (typeof window === 'undefined' || !tenantId) return
  try {
    if (ids.length === 0) window.localStorage.removeItem(guestWishlistKey(tenantId))
    else window.localStorage.setItem(guestWishlistKey(tenantId), JSON.stringify(normalizeWishlistIds(ids)))
  } catch {
    /* storage full / blocked — wishlist stays in memory for this visit */
  }
}

/** Toggle helper: newest first, capped. */
export function toggleWishlistId(ids: string[], productId: string): string[] {
  const id = productId.toLowerCase()
  if (ids.includes(id)) return ids.filter((x) => x !== id)
  return [id, ...ids].slice(0, WISHLIST_MAX_ITEMS)
}

function url(path: string): string {
  return `${env.API_BASE_URL.replace(/\/+$/, '')}${path}`
}

async function call<T>(
  tenantId: string,
  path: string,
  init: { method?: string; body?: unknown; accessToken?: string } = {},
): Promise<T> {
  const res = await fetch(url(path), {
    method: init.method ?? 'GET',
    headers: withTenantId(tenantId, {
      Accept: 'application/json',
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(init.accessToken ? { Authorization: `Bearer ${init.accessToken}` } : {}),
    }),
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as {
    success?: boolean
    code?: string
    message?: string
    data?: T
  } | null
  if (res.status === 403 && json?.code === 'ADDON_INACTIVE') {
    throw new WishlistUnavailableError(json.message || 'Wishlist is not enabled for this store')
  }
  if (!res.ok || !json?.success || json.data === undefined) {
    throw new Error(json?.message || `Wishlist request failed (${res.status})`)
  }
  return json.data
}

export function fetchAccountWishlist(tenantId: string, accessToken: string) {
  return call<WishlistServerView>(tenantId, '/public/storefront/customers/wishlist', { accessToken })
}

export function addAccountWishlistItem(tenantId: string, accessToken: string, productId: string) {
  return call<WishlistServerView>(tenantId, '/public/storefront/customers/wishlist', {
    method: 'POST',
    accessToken,
    body: { productId },
  })
}

export function removeAccountWishlistItem(tenantId: string, accessToken: string, productId: string) {
  return call<WishlistServerView>(
    tenantId,
    `/public/storefront/customers/wishlist/${encodeURIComponent(productId)}`,
    { method: 'DELETE', accessToken },
  )
}

export function mergeGuestWishlist(tenantId: string, accessToken: string, productIds: string[]) {
  return call<WishlistServerView & { added: number }>(tenantId, '/public/storefront/customers/wishlist/merge', {
    method: 'POST',
    accessToken,
    body: { productIds },
  })
}

export async function fetchWishlistProducts(tenantId: string, ids: string[]): Promise<WishlistProduct[]> {
  if (!ids.length) return []
  const data = await call<{ products: WishlistProduct[] }>(
    tenantId,
    `/public/storefront/wishlist/products?ids=${encodeURIComponent(ids.join(','))}`,
  )
  return data.products
}
