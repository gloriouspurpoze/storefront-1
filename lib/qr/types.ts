/** QR code registry — tenant-scoped identity + routing (vendored from @profixer/utils). */

export type QrCodeStatus = 'active' | 'paused' | 'revoked'

export type QrUseCase =
  | 'menu_table'
  | 'menu_general'
  | 'order_track'
  | 'book_service'
  | 'book_table'
  | 'review'
  | 'lead_capture'
  | 'product_detail'
  | 'provider_profile'
  | 'payment_static'
  | 'app_download'

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H'

export interface QrCodeBranding {
  fgColor?: string
  bgColor?: string
  logoUrl?: string
  eccLevel?: QrErrorCorrection
}

export interface QrCodeContext {
  tableId?: string
  tableLabel?: string
  section?: string
  locationId?: string
  serviceSlug?: string
  productSlug?: string
  professionalId?: string
  campaignId?: string
  orderId?: string
  trackingToken?: string
  vpa?: string
  payeeName?: string
  [key: string]: string | undefined
}

export interface QrCodeRecord {
  id: string
  tenantId: string
  publicCode: string
  useCase: QrUseCase
  status: QrCodeStatus
  label?: string
  context: QrCodeContext
  destinationUrl?: string | null
  branding?: QrCodeBranding
  expiresAt?: string | null
  scanCount?: number
  createdAt: string
  updatedAt: string
}

export interface QrResolveResult {
  qr: QrCodeRecord
  redirectUrl: string
}
