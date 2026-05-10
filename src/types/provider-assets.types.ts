export type ProviderAssetCategory =
  | 'tool'
  | 'vehicle'
  | 'kit'
  | 'spare_part'
  | 'ppe'
  | 'consumable'
  | 'device'
  | 'other'

export type ProviderAssetStatus = 'active' | 'maintenance' | 'retired' | 'lost'

export type ProviderAssetRegistrationSource = 'admin' | 'professional_request'

export interface ProviderAssetDto {
  id: string
  tenantId: string | null
  /** Technician account (your product uses “provider” = professional). */
  professionalId: string
  assetTag: string
  name: string
  category: ProviderAssetCategory
  linkedProductId: string | null
  linkedPlatformServiceId: string | null
  serialNumber: string | null
  status: ProviderAssetStatus
  quantity: number
  purchaseDate?: string | null
  warrantyExpiresAt?: string | null
  locationNotes?: string | null
  notes?: string | null
  archivedAt?: string | null
  registrationSource?: ProviderAssetRegistrationSource
  requestId?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ProviderAssetListResponse {
  assets: ProviderAssetDto[]
  total: number
  page: number
  limit: number
}

export type ProviderAssetRequestStatus = 'pending' | 'approved' | 'rejected'

export interface ProviderAssetRequestDto {
  id: string
  tenantId: string | null
  professionalId: string
  professionalName?: string | null
  professionalEmail?: string | null
  name: string
  category: ProviderAssetCategory
  quantity: number
  serialNumber?: string | null
  suggestedAssetTag?: string | null
  notes?: string | null
  status: ProviderAssetRequestStatus
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewNotes?: string | null
  createdAssetId?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ProviderAssetRequestListResponse {
  requests: ProviderAssetRequestDto[]
  total: number
  page: number
  limit: number
}
