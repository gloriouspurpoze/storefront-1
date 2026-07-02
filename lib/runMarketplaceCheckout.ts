import { env } from './env'
import { withTenantId } from './tenant-headers'
import { openRazorpayCheckout } from './razorpayCheckout'

export interface MarketplaceCheckoutLine {
  listingId: string
  quantity: number
  metadata?: Record<string, unknown>
}

export interface MarketplaceCheckoutCustomer {
  email: string
  name?: string
  phone?: string
}

function apiUrl(path: string): string {
  return `${env.API_BASE_URL.replace(/\/+$/, '')}${path}`
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
}

export async function quoteMarketplaceCheckout(input: {
  tenantId: string
  lines: MarketplaceCheckoutLine[]
}) {
  const res = await fetch(apiUrl('/public/marketplace/checkout/quote'), {
    method: 'POST',
    headers: withTenantId(input.tenantId, {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify({ lines: input.lines }),
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<{
    subtotalInr: number
    shippingInr: number
    totalInr: number
    sellerGroups: unknown[]
  }> | null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || `Quote failed (${res.status})`)
  }
  return json.data
}

export async function createMarketplaceCheckoutOrder(input: {
  tenantId: string
  lines: MarketplaceCheckoutLine[]
  customerEmail: string
  customerName?: string
  notes?: string
}) {
  const res = await fetch(apiUrl('/public/marketplace/checkout/create'), {
    method: 'POST',
    headers: withTenantId(input.tenantId, {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify({
      lines: input.lines,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      notes: input.notes,
    }),
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<{
    orderId: string
    amountPaise: number
    currency: 'INR'
    keyId: string
    quote?: { totalInr: number }
  }> | null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || `Checkout failed (${res.status})`)
  }
  return json.data
}

export async function verifyMarketplaceCheckout(input: {
  tenantId: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  customerEmail: string
  customerName?: string
  phone?: string
}) {
  const res = await fetch(apiUrl('/public/marketplace/checkout/verify'), {
    method: 'POST',
    headers: withTenantId(input.tenantId, {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify(input),
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<{
    checkoutNumber: string
    parentCheckoutId: string
    checkoutBatchId: string
    subOrders: Array<{ subOrderNumber: string; listingType: string; sellerName: string }>
  }> | null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || `Verification failed (${res.status})`)
  }
  return json.data
}

export async function runMarketplaceCheckout(input: {
  tenantId: string
  tenantName: string
  brandColor?: string
  lines: MarketplaceCheckoutLine[]
  customer: MarketplaceCheckoutCustomer
  notes?: string
}) {
  if (!input.lines.length) {
    throw new Error('Your cart is empty.')
  }

  const order = await createMarketplaceCheckoutOrder({
    tenantId: input.tenantId,
    lines: input.lines,
    customerEmail: input.customer.email,
    customerName: input.customer.name,
    notes: input.notes,
  })

  const itemCount = input.lines.reduce((sum, l) => sum + l.quantity, 0)
  const payment = await openRazorpayCheckout({
    keyId: order.keyId,
    orderId: order.orderId,
    amountPaise: order.amountPaise,
    currency: order.currency,
    name: input.tenantName,
    description: `${itemCount} item${itemCount === 1 ? '' : 's'} · marketplace`,
    prefill: {
      email: input.customer.email,
      name: input.customer.name,
      contact: input.customer.phone,
    },
    themeColor: input.brandColor,
  })

  const verified = await verifyMarketplaceCheckout({
    tenantId: input.tenantId,
    razorpay_order_id: payment.razorpay_order_id,
    razorpay_payment_id: payment.razorpay_payment_id,
    razorpay_signature: payment.razorpay_signature,
    customerEmail: input.customer.email,
    customerName: input.customer.name,
    phone: input.customer.phone,
  })

  return verified
}

export async function searchMarketplace(input: {
  tenantId: string
  q?: string
  types?: string
  page?: number
}) {
  const params = new URLSearchParams()
  if (input.q) params.set('q', input.q)
  if (input.types) params.set('types', input.types)
  if (input.page) params.set('page', String(input.page))
  const res = await fetch(apiUrl(`/public/marketplace/search?${params}`), {
    headers: withTenantId(input.tenantId, { Accept: 'application/json' }),
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<{ listings: unknown[] }> | null
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Search failed')
  }
  return json.data ?? { listings: [] }
}

export async function fetchSellerStore(input: { tenantId: string; sellerSlug: string }) {
  const res = await fetch(apiUrl(`/public/marketplace/sellers/${encodeURIComponent(input.sellerSlug)}`), {
    headers: withTenantId(input.tenantId, { Accept: 'application/json' }),
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<{ seller: unknown; listings: unknown[] }> | null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || 'Store not found')
  }
  return json.data
}
