/**
 * Public API client for the paid storefront add-ons (AMC offers, B2B portal).
 * Backend: fixer-backend `modules/storefront-addons` — endpoints 403 unless the add-on is active.
 */
import { env } from './env'
import { withTenantId } from './tenant-headers'

export interface StorefrontLoyaltySettings {
  pointsPer100Inr?: number
  welcomeBonusPoints?: number
  pointValueInr?: number
  headline?: string
  rewardsSummary?: string
  terms?: string
}

export interface StorefrontAmcPackage {
  id: string
  title: string
  slug: string
  summary: string
  description?: string
  inclusions: string[]
  visitsIncluded: number
  durationMonths: number
  priceFrom?: number
  currency: string
  imageUrl?: string
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

function apiUrl(path: string): string {
  return `${env.API_BASE_URL.replace(/\/+$/, '')}${path}`
}

/** Server-side: tenant's published AMC plans (empty when the add-on is off or on error). */
export async function fetchAmcPackages(tenantId: string): Promise<StorefrontAmcPackage[]> {
  if (!tenantId) return []
  try {
    const res = await fetch(apiUrl(`/public/storefront/amc/packages?__tenant=${encodeURIComponent(tenantId)}`), {
      headers: withTenantId(tenantId, { Accept: 'application/json' }),
      next: { revalidate: 120, tags: [`tenant:${tenantId}`, `tenant:${tenantId}:amc`] },
    })
    if (!res.ok) return []
    const json = (await res.json().catch(() => null)) as ApiEnvelope<{ packages: StorefrontAmcPackage[] }> | null
    return json?.success ? (json.data?.packages ?? []) : []
  } catch {
    return []
  }
}

async function postJson<T>(path: string, tenantId: string, body: unknown, accessToken?: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: withTenantId(tenantId, {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    }),
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || json?.message || `Submit failed (${res.status})`)
  }
  return json.data as T
}

export interface AmcEnquiryInput {
  packageId: string
  name: string
  email?: string
  phone: string
  address: string
  message?: string
}

export function submitAmcEnquiry(tenantId: string, input: AmcEnquiryInput, accessToken?: string) {
  return postJson<{ id: string; dealId: string }>('/public/storefront/amc/enquiry', tenantId, input, accessToken)
}

export interface B2bInquiryInput {
  companyName: string
  gstin?: string
  contactName: string
  email?: string
  phone: string
  city?: string
  quantity?: string
  requirements: string
}

export function submitB2bInquiry(tenantId: string, input: B2bInquiryInput, accessToken?: string) {
  return postJson<{ id: string; dealId: string }>('/public/storefront/b2b/inquiry', tenantId, input, accessToken)
}

export function formatInr(amount: number, currency = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString('en-IN')}`
  }
}
