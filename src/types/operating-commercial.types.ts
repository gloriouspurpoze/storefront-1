export interface TenantCommercialTermsDto {
  id: string
  tenantId: string | null
  currency: string
  convenienceFeePercent: number
  convenienceFeeFixed: number
  trainingFeePerProfessional: number
  providerCommissionPercent: number
  paymentProcessingFeePercent: number
  minimumPlatformFeePerBooking: number
  gstPercentOnFees: number
  afterHoursSurchargePercent: number
  internalNotes?: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface OperatingCityDto {
  id: string
  tenantId?: string | null
  name: string
  state?: string
  slug: string
  isActive: boolean
  sortOrder: number
  priceMultiplier: number
  serviceRadiusKm?: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface OperatingCityListResponse {
  cities: OperatingCityDto[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}
