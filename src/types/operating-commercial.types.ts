import type { CommissionSlab } from './founder-finance.types'

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
  /** Tiered platform commission by GMV slab (founder finance / simulator). */
  commissionSlabs?: CommissionSlab[]
  /** % of ticket applied as support cost in unit-economics model. */
  supportCostPercent?: number
  /** % of ticket reserved for refunds in unit-economics model. */
  refundReservePercent?: number
  /** % of ticket allocated to marketing in unit-economics model. */
  marketingAllocationPercent?: number
  /** Flat visiting / inspection fee charged on every booking (industry standard line). */
  visitingFeeFixed?: number
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
