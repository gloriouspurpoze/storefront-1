import type { CommissionSlab } from '../types/founder-finance.types'
import type { TenantCommercialTermsDto } from '../types/operating-commercial.types'

/** Default slab engine matching the founder spreadsheet. */
export const DEFAULT_COMMISSION_SLABS: CommissionSlab[] = [
  { minAmount: 0, maxAmount: 499, percent: 20 },
  { minAmount: 500, maxAmount: 999, percent: 17.5 },
  { minAmount: 1000, maxAmount: null, percent: 15 },
]

export const DEFAULT_SUPPORT_COST_PERCENT = 2
export const DEFAULT_REFUND_RESERVE_PERCENT = 1.5
export const DEFAULT_MARKETING_ALLOCATION_PERCENT = 5

// Industry-standard customer-facing fee defaults (Indian home-services market,
// modeled on Urban Company / Housejoy disclosure norms).
export const DEFAULT_VISITING_FEE_FIXED = 0
export const DEFAULT_PLATFORM_FEE_FIXED = 0
export const DEFAULT_CONVENIENCE_FEE_PERCENT = 0
export const DEFAULT_CONVENIENCE_FEE_FIXED = 0
export const DEFAULT_GST_PERCENT_ON_FEES = 18

export interface TicketSimulationOverrides {
  commissionPercent?: number
  paymentProcessingFeePercent?: number
  supportCostPercent?: number
  refundReservePercent?: number
  marketingAllocationPercent?: number
  // Customer-facing fee overrides (industry-standard breakdown)
  visitingFeeFixed?: number
  platformFeeFixed?: number
  convenienceFeePercent?: number
  convenienceFeeFixed?: number
  gstPercentOnFees?: number
}

export interface TicketSimulationResult {
  /* ---------- service / GMV ---------- */
  /** Service charges shown to the customer (base × city multiplier). */
  serviceAmount: number
  /** Backwards-compat alias for `serviceAmount`. Older consumers read this. */
  ticketAmount: number

  /* ---------- commission / payout ---------- */
  commissionPercent: number
  commissionAmount: number
  /** Service charges minus commission — what the provider takes home. */
  providerPayout: number

  /* ---------- customer-facing fees (platform revenue) ---------- */
  visitingFee: number
  platformFee: number
  convenienceFee: number
  /** Sum of all add-on fees (excludes GST). */
  feesSubtotal: number
  /** GST on fees — pass-through to govt, not platform revenue. */
  gstOnFees: number
  /** Total amount charged to the customer at checkout. */
  customerPays: number

  /* ---------- platform revenue ---------- */
  /** Commission + add-on fees. GST is pass-through and excluded. */
  platformRevenue: number

  /* ---------- operating costs ---------- */
  /** Gateway fee charged on the total amount processed (customerPays). */
  gatewayFee: number
  /** Modeled as % of service amount (industry parity with cost-of-fulfilment). */
  supportCost: number
  refundReserve: number
  marketingAllocation: number

  /* ---------- bottom line ---------- */
  /** Equivalent to platformRevenue at this level (no COGS modeled). */
  grossProfit: number
  netProfit: number
  /** Net profit as % of customerPays — the metric the founder watches. */
  marginPercent: number
}

export function resolveCommissionSlabs(terms: TenantCommercialTermsDto): CommissionSlab[] {
  if (terms.commissionSlabs?.length) return terms.commissionSlabs
  return DEFAULT_COMMISSION_SLABS
}

export function pickCommissionPercent(slabs: CommissionSlab[], amount: number): number {
  const sorted = [...slabs].sort((a, b) => a.minAmount - b.minAmount)
  for (const slab of sorted) {
    const inMax = slab.maxAmount == null || amount <= slab.maxAmount
    if (amount >= slab.minAmount && inMax) return slab.percent
  }
  const last = sorted[sorted.length - 1]
  return last?.percent ?? 0
}

function pctOf(amount: number, percent: number): number {
  return (amount * percent) / 100
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Unit-economics for a single ticket — the spreadsheet row.
 *
 * Industry-standard pricing flow:
 *
 *   service charges (base × city)
 *   + visiting fee (flat, e.g. ₹49 — covers technician travel)
 *   + platform fee (flat, e.g. ₹19 — small flat platform line)
 *   + convenience fee (% of service + flat)
 *   + GST on fees (pass-through)
 *   ─────────────────
 *   = customer pays
 *
 * Platform economics:
 *
 *   commission (slab % of service charges)
 *   + visiting fee + platform fee + convenience fee   = platform revenue
 *   − gateway (% of customer pays)
 *   − support (% of service charges)
 *   − refund reserve (% of service charges)
 *   − marketing allocation (% of service charges)
 *   ─────────────────
 *   = net profit
 *
 * Margin% = net profit ÷ customer pays. Provider takes home `service - commission`;
 * the visiting and platform fees are fully retained by the platform.
 */
export function simulateTicket(
  baseAmount: number,
  terms: TenantCommercialTermsDto,
  cityMultiplier = 1,
  overrides?: TicketSimulationOverrides,
): TicketSimulationResult {
  const serviceAmount = Math.max(0, baseAmount * cityMultiplier)
  const slabs = resolveCommissionSlabs(terms)

  const commissionPercent =
    overrides?.commissionPercent ??
    pickCommissionPercent(slabs, serviceAmount) ??
    terms.providerCommissionPercent ??
    0

  const commissionAmount = pctOf(serviceAmount, commissionPercent)
  const providerPayout = Math.max(0, serviceAmount - commissionAmount)

  // Customer-facing fees
  const visitingFee =
    overrides?.visitingFeeFixed ?? terms.visitingFeeFixed ?? DEFAULT_VISITING_FEE_FIXED
  // Reuses `minimumPlatformFeePerBooking` as the flat platform fee — that's its
  // operational meaning today (small line shown to the customer at checkout).
  const platformFee =
    overrides?.platformFeeFixed ?? terms.minimumPlatformFeePerBooking ?? DEFAULT_PLATFORM_FEE_FIXED
  const convPct =
    overrides?.convenienceFeePercent ?? terms.convenienceFeePercent ?? DEFAULT_CONVENIENCE_FEE_PERCENT
  const convFixed =
    overrides?.convenienceFeeFixed ?? terms.convenienceFeeFixed ?? DEFAULT_CONVENIENCE_FEE_FIXED
  const convenienceFee = pctOf(serviceAmount, convPct) + convFixed

  const feesSubtotal = visitingFee + platformFee + convenienceFee
  const gstPct = overrides?.gstPercentOnFees ?? terms.gstPercentOnFees ?? DEFAULT_GST_PERCENT_ON_FEES
  const gstOnFees = pctOf(feesSubtotal, gstPct)
  const customerPays = serviceAmount + feesSubtotal + gstOnFees

  const platformRevenue = commissionAmount + feesSubtotal

  // Operating costs
  const gatewayPct =
    overrides?.paymentProcessingFeePercent ?? terms.paymentProcessingFeePercent ?? 0
  const supportPct =
    overrides?.supportCostPercent ?? terms.supportCostPercent ?? DEFAULT_SUPPORT_COST_PERCENT
  const refundPct =
    overrides?.refundReservePercent ?? terms.refundReservePercent ?? DEFAULT_REFUND_RESERVE_PERCENT
  const marketingPct =
    overrides?.marketingAllocationPercent ??
    terms.marketingAllocationPercent ??
    DEFAULT_MARKETING_ALLOCATION_PERCENT

  // Gateway is charged on the actual amount processed, not just the service line.
  const gatewayFee = pctOf(customerPays, gatewayPct)
  const supportCost = pctOf(serviceAmount, supportPct)
  const refundReserve = pctOf(serviceAmount, refundPct)
  const marketingAllocation = pctOf(serviceAmount, marketingPct)

  const grossProfit = platformRevenue
  const netProfit = grossProfit - gatewayFee - supportCost - refundReserve - marketingAllocation
  const marginPercent = customerPays > 0 ? (netProfit / customerPays) * 100 : 0

  return {
    serviceAmount: round2(serviceAmount),
    ticketAmount: round2(serviceAmount),
    commissionPercent,
    commissionAmount: round2(commissionAmount),
    providerPayout: round2(providerPayout),
    visitingFee: round2(visitingFee),
    platformFee: round2(platformFee),
    convenienceFee: round2(convenienceFee),
    feesSubtotal: round2(feesSubtotal),
    gstOnFees: round2(gstOnFees),
    customerPays: round2(customerPays),
    platformRevenue: round2(platformRevenue),
    gatewayFee: round2(gatewayFee),
    supportCost: round2(supportCost),
    refundReserve: round2(refundReserve),
    marketingAllocation: round2(marketingAllocation),
    grossProfit: round2(grossProfit),
    netProfit: round2(netProfit),
    marginPercent,
  }
}

export function marginStatus(marginPercent: number): 'good' | 'warn' | 'bad' {
  if (marginPercent >= 12) return 'good'
  if (marginPercent >= 6) return 'warn'
  return 'bad'
}
