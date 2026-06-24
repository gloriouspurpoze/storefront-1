/**
 * Partner loyalty tier scoring — mirrored from fixer-backend partnerLoyaltyScore.ts
 */

export type PartnerLoyaltyTier = 'bronze' | 'silver' | 'gold' | 'elite'

export interface PartnerLoyaltyTierRule {
  tier: PartnerLoyaltyTier
  label: string
  minCompletedJobs: number
  minRating: number
  maxCancelRatePercent: number
  requiresVerified: boolean
  commissionPercent?: number
  priorityBoost?: number
}

export interface PartnerLoyaltyTierConfigShape {
  enabled: boolean
  rollingWindowDays: number
  tiers: PartnerLoyaltyTierRule[]
  autoApplyCommission: boolean
}

export interface PartnerLoyaltyInput {
  rating: number
  completedJobs: number
  cancelledJobs: number
  isVerified: boolean
  verificationStatus?: string
}

export interface PartnerLoyaltyScoreResult {
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

export const DEFAULT_PARTNER_LOYALTY_CONFIG: PartnerLoyaltyTierConfigShape = {
  enabled: true,
  rollingWindowDays: 90,
  autoApplyCommission: false,
  tiers: [
    {
      tier: 'bronze',
      label: 'Bronze',
      minCompletedJobs: 0,
      minRating: 0,
      maxCancelRatePercent: 100,
      requiresVerified: false,
      commissionPercent: 15,
      priorityBoost: 0,
    },
    {
      tier: 'silver',
      label: 'Silver',
      minCompletedJobs: 30,
      minRating: 4.0,
      maxCancelRatePercent: 8,
      requiresVerified: true,
      commissionPercent: 13,
      priorityBoost: 4,
    },
    {
      tier: 'gold',
      label: 'Gold',
      minCompletedJobs: 80,
      minRating: 4.5,
      maxCancelRatePercent: 5,
      requiresVerified: true,
      commissionPercent: 11,
      priorityBoost: 8,
    },
    {
      tier: 'elite',
      label: 'Elite',
      minCompletedJobs: 150,
      minRating: 4.8,
      maxCancelRatePercent: 3,
      requiresVerified: true,
      commissionPercent: 9,
      priorityBoost: 12,
    },
  ],
}

const TIER_ORDER: PartnerLoyaltyTier[] = ['bronze', 'silver', 'gold', 'elite']

function isVerifiedInput(input: PartnerLoyaltyInput): boolean {
  return input.isVerified || input.verificationStatus === 'verified'
}

export function cancelRatePercent(completedJobs: number, cancelledJobs: number): number {
  const total = completedJobs + cancelledJobs
  if (total <= 0) return 0
  return Math.round((cancelledJobs / total) * 1000) / 10
}

function ruleForTier(config: PartnerLoyaltyTierConfigShape, tier: PartnerLoyaltyTier): PartnerLoyaltyTierRule {
  return (
    config.tiers.find((t) => t.tier === tier) ??
    DEFAULT_PARTNER_LOYALTY_CONFIG.tiers.find((t) => t.tier === tier)!
  )
}

function qualifies(input: PartnerLoyaltyInput, rule: PartnerLoyaltyTierRule, cancelPct: number): boolean {
  if (rule.requiresVerified && !isVerifiedInput(input)) return false
  if (input.rating < rule.minRating) return false
  if (input.completedJobs < rule.minCompletedJobs) return false
  if (cancelPct > rule.maxCancelRatePercent) return false
  return true
}

export function compositeScore(input: PartnerLoyaltyInput, cancelPct: number): number {
  const ratingPart = Math.min(5, Math.max(0, input.rating)) / 5
  const jobsPart = Math.min(200, input.completedJobs) / 200
  const cancelPart = Math.max(0, 1 - cancelPct / 20)
  const verifiedPart = isVerifiedInput(input) ? 1 : 0.5
  return Math.round((ratingPart * 40 + jobsPart * 35 + cancelPart * 15 + verifiedPart * 10) * 10) / 10
}

export function scorePartnerLoyalty(
  input: PartnerLoyaltyInput,
  config: PartnerLoyaltyTierConfigShape = DEFAULT_PARTNER_LOYALTY_CONFIG,
): PartnerLoyaltyScoreResult {
  const cancelPct = cancelRatePercent(input.completedJobs, input.cancelledJobs)
  const score = compositeScore(input, cancelPct)

  if (!config.enabled) {
    const bronze = ruleForTier(config, 'bronze')
    return {
      tier: 'bronze',
      label: bronze.label,
      score,
      cancelRatePercent: cancelPct,
      commissionPercent: bronze.commissionPercent ?? 15,
      priorityBoost: bronze.priorityBoost ?? 0,
      nextTier: 'silver',
      jobsToNextTier: null,
      ratingGapToNextTier: null,
    }
  }

  let assigned: PartnerLoyaltyTier = 'bronze'
  for (const tier of [...TIER_ORDER].reverse()) {
    const rule = ruleForTier(config, tier)
    if (qualifies(input, rule, cancelPct)) {
      assigned = tier
      break
    }
  }

  const assignedRule = ruleForTier(config, assigned)
  const idx = TIER_ORDER.indexOf(assigned)
  const nextTier = idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null
  let jobsToNextTier: number | null = null
  let ratingGapToNextTier: number | null = null

  if (nextTier) {
    const nextRule = ruleForTier(config, nextTier)
    jobsToNextTier = Math.max(0, nextRule.minCompletedJobs - input.completedJobs)
    ratingGapToNextTier =
      input.rating < nextRule.minRating
        ? Math.round((nextRule.minRating - input.rating) * 10) / 10
        : 0
  }

  return {
    tier: assigned,
    label: assignedRule.label,
    score,
    cancelRatePercent: cancelPct,
    commissionPercent: assignedRule.commissionPercent ?? 15,
    priorityBoost: assignedRule.priorityBoost ?? 0,
    nextTier,
    jobsToNextTier,
    ratingGapToNextTier,
  }
}

export function loyaltyPriorityBoostForTier(tier: PartnerLoyaltyTier | undefined | null): number {
  if (!tier) return 0
  const rule = DEFAULT_PARTNER_LOYALTY_CONFIG.tiers.find((t) => t.tier === tier)
  return rule?.priorityBoost ?? 0
}

export function tierBadgeVariant(
  tier: PartnerLoyaltyTier,
): 'default' | 'secondary' | 'outline' | 'success' | 'warning' {
  switch (tier) {
    case 'elite':
      return 'default'
    case 'gold':
      return 'success'
    case 'silver':
      return 'secondary'
    default:
      return 'outline'
  }
}
