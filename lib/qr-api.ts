import { env } from './env'
import type { QrCodeRecord, QrResolveResult } from './qr'

interface ApiEnvelope<T> {
  success: boolean
  data?: T
}

function apiUrl(path: string): string {
  return `${env.API_BASE_URL.replace(/\/+$/, '')}${path}`
}

/** Fetch all QR codes for a tenant (public, cached). */
export async function fetchPublicQrCodes(tenantId: string): Promise<QrCodeRecord[]> {
  if (!tenantId) return []
  try {
    const res = await fetch(apiUrl('/public/qr/codes'), {
      headers: {
        Accept: 'application/json',
        'x-tenant-id': tenantId,
      },
      next: { revalidate: 30, tags: [`tenant:${tenantId}:qr`] },
    })
    if (!res.ok) return []
    const json = (await res.json().catch(() => null)) as ApiEnvelope<QrCodeRecord[]> | null
    return json?.success ? (json.data ?? []) : []
  } catch {
    return []
  }
}

export async function resolveQrViaApi(
  tenantId: string,
  publicCode: string,
): Promise<QrResolveResult | null> {
  if (!tenantId || !publicCode) return null
  try {
    const res = await fetch(
      apiUrl(`/public/qr/${encodeURIComponent(publicCode)}/resolve`),
      {
        headers: {
          Accept: 'application/json',
          'x-tenant-id': tenantId,
        },
        cache: 'no-store',
      },
    )
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as ApiEnvelope<QrResolveResult> | null
    return json?.success ? (json.data ?? null) : null
  } catch {
    return null
  }
}
