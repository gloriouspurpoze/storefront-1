/** Commission tier by booking GMV (major currency units, e.g. INR). */
export interface CommissionSlab {
  minAmount: number
  maxAmount: number | null
  percent: number
}

export type CacChannel = 'google' | 'meta' | 'seo' | 'referral' | 'other'

export type FounderPnlGranularity = 'monthly' | 'daily'

export interface FounderPnlRow {
  period: string
  orders: number
  gmv: number
  revenue: number
  providerPayout: number
  gatewayFee: number
  supportCost: number
  refundReserve: number
  marketingSpend: number
  grossProfit: number
  netProfit: number
  marginPercent: number
}

export interface FounderCityPnlRow {
  city: string
  orders: number
  gmv: number
  revenue: number
  providerPayout: number
  netProfit: number
  marginPercent: number
  priceMultiplier: number
}

export interface FounderCacEntry {
  id: string
  month: string
  channel: CacChannel
  spend: number
  attributedCustomers: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface FounderCacChannelSummary {
  channel: CacChannel
  spend: number
  /**
   * Final attributed customer count actually used for CAC: founder-entered
   * `acquiredManual` when > 0, otherwise auto-attributed `acquiredAuto`.
   * Backwards-compatible name kept for existing UI consumers.
   */
  acquired: number
  /** Founder-entered override (legacy `attributedCustomers`). */
  acquiredManual: number
  /** Auto-counted from `User.attribution.firstTouch.channel` signups in range. */
  acquiredAuto: number
  cac: number
}

export interface FounderCacSummary {
  totalSpend: number
  totalAcquired: number
  /** Sum of `acquiredAuto` across all channels. */
  totalAcquiredAuto: number
  /** Total new customer signups in window (attributed + unattributed). */
  totalSignups: number
  blendedCac: number
  byChannel: FounderCacChannelSummary[]
}

/**
 * 7-bucket attribution channel mirroring `User.attribution.firstTouch.channel`.
 * Wider than `CacChannel` because organic / direct don't have spend buckets but
 * still matter for understanding where customers come from.
 */
export type AttributionChannel =
  | 'google_ads'
  | 'meta_ads'
  | 'seo'
  | 'social_organic'
  | 'referral'
  | 'direct'
  | 'other'

export interface FounderAttributionChannelRow {
  channel: AttributionChannel
  customers: number
  sharePercent: number
}

export interface FounderAttributionBreakdown {
  totalSignups: number
  totalAttributed: number
  attributionCoveragePercent: number
  byChannel: FounderAttributionChannelRow[]
}

export type FounderLeaderboardSortBy = 'revenue' | 'margin' | 'cancellation' | 'rating'

export interface FounderProviderLeaderboardRow {
  providerId: string
  name: string
  completedJobs: number
  gmv: number
  revenueToPlatform: number
  providerEarnings: number
  cancellationRate: number
  averageRating: number
  marginPercent: number
}

export type ProviderCostStatus = 'ok' | 'overpaid' | 'underpaid'

export interface FounderProviderCostRow {
  providerId: string
  name: string
  modeledPayout: number
  actualPayout: number
  variance: number
  variancePercent: number
  status: ProviderCostStatus
}

export interface CreateFounderCacBody {
  month: string
  channel: CacChannel
  spend: number
  attributedCustomers: number
  notes?: string
}

export interface UpdateFounderCacBody {
  month?: string
  channel?: CacChannel
  spend?: number
  attributedCustomers?: number
  notes?: string
}
