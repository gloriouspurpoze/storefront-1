import type { PartnerLoyaltyTier, PartnerLoyaltyTierRule } from '../lib/partnerLoyaltyScore'

export interface PartnerLoyaltyConfigDto {
  id?: string
  tenantId?: string | null
  enabled: boolean
  rollingWindowDays: number
  autoApplyCommission: boolean
  tiers: PartnerLoyaltyTierRule[]
  updatedAt?: string
  createdAt?: string
}

export interface PartnerLoyaltyRosterRow {
  professionalId: string
  firstName?: string
  lastName?: string
  email?: string
  city?: string
  rating: number
  completedJobs: number
  cancelledJobs: number
  isVerified: boolean
  verificationStatus?: string
  storedTier?: PartnerLoyaltyTier
  storedScore?: number
  tier: PartnerLoyaltyTier
  label: string
  score: number
  cancelRatePercent: number
  commissionPercent: number
  priorityBoost: number
  nextTier: PartnerLoyaltyTier | null
  jobsToNextTier: number | null
  ratingGapToNextTier: number | null
}

export interface PartnerLoyaltyRosterResponse {
  rows: PartnerLoyaltyRosterRow[]
  total: number
  page: number
  limit: number
}

export interface PartnerLoyaltyRecalculateResult {
  processed: number
  updated: number
}
