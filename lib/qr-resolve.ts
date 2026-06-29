import type { QrCodeRecord, QrResolveResult } from './qr'
import { buildQrScanUrl, resolveQrRecord } from './qr'
import { fetchPublicQrCodes, resolveQrViaApi } from './qr-api'
import { findQrInRegistry, incrementScanInRegistry } from './qr-registry'

export interface QrResolveInput {
  tenantId: string
  tenantSlug: string
  verticalKey?: string
  publicCode: string
  storefrontOrigin: string
}

async function findQrRecord(tenantId: string, publicCode: string): Promise<QrCodeRecord | null> {
  const fromApi = await fetchPublicQrCodes(tenantId)
  const code = publicCode.trim().toUpperCase()
  const hit = fromApi.find((r) => r.publicCode === code)
  if (hit) return hit
  return findQrInRegistry(tenantId, code)
}

/** Resolve a QR scan to a redirect URL. */
export async function resolveQrScan(input: QrResolveInput): Promise<QrResolveResult> {
  const apiResult = await resolveQrViaApi(input.tenantId, input.publicCode)
  if (apiResult) return apiResult

  const qr = await findQrRecord(input.tenantId, input.publicCode)
  if (!qr) {
    throw new Error('QR code not found')
  }

  const result = resolveQrRecord(qr, {
    storefrontOrigin: input.storefrontOrigin,
    verticalKey: input.verticalKey,
    tenantSlug: input.tenantSlug,
  })

  if (process.env.NODE_ENV === 'development') {
    await incrementScanInRegistry(input.tenantId, input.publicCode).catch(() => undefined)
  }

  return result
}

export function qrPayloadUrl(input: QrResolveInput): string {
  return buildQrScanUrl(input.storefrontOrigin, input.publicCode)
}
