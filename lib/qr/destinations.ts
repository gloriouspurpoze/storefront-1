import type { QrCodeRecord, QrResolveResult } from './types'

export interface QrDestinationInput {
  storefrontOrigin: string
  verticalKey?: string
  tenantSlug?: string
}

function originBase(origin: string): string {
  return origin.replace(/\/+$/, '')
}

function withUtm(url: string, qr: QrCodeRecord): string {
  try {
    const u = new URL(url)
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'qr')
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', qr.useCase)
    if (!u.searchParams.has('utm_content')) u.searchParams.set('utm_content', qr.publicCode)
    return u.toString()
  } catch {
    return url
  }
}

/** Build the storefront path/URL a QR should redirect to (before UTM). */
export function buildQrDestination(qr: QrCodeRecord, input: QrDestinationInput): string {
  if (qr.destinationUrl?.trim()) {
    const d = qr.destinationUrl.trim()
    if (d.startsWith('http://') || d.startsWith('https://')) return d
    return `${originBase(input.storefrontOrigin)}${d.startsWith('/') ? d : `/${d}`}`
  }

  const base = originBase(input.storefrontOrigin)
  const ctx = qr.context ?? {}

  switch (qr.useCase) {
    case 'menu_table': {
      const t = ctx.tableLabel ?? ctx.tableId ?? ''
      const loc = ctx.locationId ? `&loc=${encodeURIComponent(ctx.locationId)}` : ''
      return `${base}/menu?t=${encodeURIComponent(t)}${loc}`
    }
    case 'menu_general':
      return `${base}/menu`
    case 'book_service': {
      const svc = ctx.serviceSlug ? `?service=${encodeURIComponent(ctx.serviceSlug)}` : '?src=qr'
      return `${base}/book${svc}`
    }
    case 'book_table':
      return `${base}/reserve${ctx.tableLabel ? `?table=${encodeURIComponent(ctx.tableLabel)}` : ''}`
    case 'order_track':
      return `${base}/orders/track${ctx.trackingToken ? `?token=${encodeURIComponent(ctx.trackingToken)}` : ''}`
    case 'product_detail':
      return ctx.productSlug
        ? `${base}/products/${encodeURIComponent(ctx.productSlug)}`
        : `${base}/products`
    case 'lead_capture':
      return `${base}/book?src=qr${ctx.campaignId ? `&campaign=${encodeURIComponent(ctx.campaignId)}` : ''}`
    case 'review':
      return `${base}/contact?intent=review`
    case 'provider_profile':
      return `${base}/book?src=qr${ctx.professionalId ? `&pro=${encodeURIComponent(ctx.professionalId)}` : ''}`
    case 'payment_static': {
      const vpa = ctx.vpa ?? ''
      const name = ctx.payeeName ?? 'Merchant'
      if (!vpa) return `${base}/checkout`
      const params = new URLSearchParams({ pa: vpa, pn: name, cu: 'INR' })
      return `upi://pay?${params.toString()}`
    }
    case 'app_download':
      return base
    default:
      return base
  }
}

export function buildQrScanUrl(storefrontOrigin: string, publicCode: string): string {
  return `${originBase(storefrontOrigin)}/q/${encodeURIComponent(publicCode)}`
}

export function resolveQrRecord(
  qr: QrCodeRecord,
  input: QrDestinationInput,
): QrResolveResult {
  if (qr.status === 'revoked') {
    throw new Error('QR code has been revoked')
  }
  if (qr.status === 'paused') {
    throw new Error('QR code is paused')
  }
  if (qr.expiresAt && new Date(qr.expiresAt).getTime() < Date.now()) {
    throw new Error('QR code has expired')
  }

  const raw = buildQrDestination(qr, input)
  const redirectUrl =
    raw.startsWith('upi://') ? raw : withUtm(raw, qr)

  return { qr, redirectUrl }
}
