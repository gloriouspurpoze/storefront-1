/**
 * Subscription module shared formatters / constants.
 */

import type {
  BillingCycle,
  PlanStatus,
  PlanType,
  SubscriptionStatus,
} from '../../services/api/subscriptions.service'

/** Indian-locale currency from paise (or rupees) — falls back to ₹0 on bad input. */
export function formatINR(amountInRupees: number | null | undefined, opts?: { compact?: boolean }) {
  const value = Number.isFinite(amountInRupees ?? NaN) ? Number(amountInRupees) : 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: opts?.compact && Math.abs(value) >= 1000 ? 1 : 0,
    notation: opts?.compact ? 'compact' : 'standard',
  }).format(value)
}

export function paiseToRupees(paise: number | undefined | null): number {
  return Math.round(((paise ?? 0) / 100) * 100) / 100
}

export function rupeesToPaise(rupees: number | string | undefined | null): number {
  const n = typeof rupees === 'string' ? Number(rupees) : (rupees ?? 0)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100)
}

export const PLAN_TYPE_LABEL: Record<PlanType, string> = {
  customer: 'Customer',
  provider: 'Provider',
}

export const BILLING_CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
}

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  archived: 'Archived',
}

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: 'In trial',
  active: 'Active',
  past_due: 'Past due',
  cancelled: 'Cancelled',
  expired: 'Expired',
  paused: 'Paused',
}

/**
 * Color tokens for subscription statuses — match the project's tone palette
 * (uses tailwind utility classes only).
 */
export function subscriptionStatusBadgeClass(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'trial':
      return 'border-sky-500/45 bg-sky-500/10 text-sky-700 dark:text-sky-300'
    case 'past_due':
      return 'border-amber-500/45 bg-amber-500/10 text-amber-800 dark:text-amber-200'
    case 'paused':
      return 'border-violet-500/45 bg-violet-500/10 text-violet-700 dark:text-violet-300'
    case 'cancelled':
      return 'border-rose-500/45 bg-rose-500/10 text-rose-700 dark:text-rose-300'
    case 'expired':
    default:
      return 'border-neutral-500/45 bg-neutral-500/10 text-neutral-700 dark:text-neutral-300'
  }
}

export function planStatusBadgeClass(status: PlanStatus): string {
  switch (status) {
    case 'active':
      return 'border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'inactive':
      return 'border-amber-500/45 bg-amber-500/10 text-amber-800 dark:text-amber-200'
    case 'archived':
    default:
      return 'border-neutral-500/45 bg-neutral-500/10 text-neutral-700 dark:text-neutral-300'
  }
}

export function billingCycleSuffix(cycle: BillingCycle): string {
  switch (cycle) {
    case 'monthly':
      return '/mo'
    case 'quarterly':
      return '/qtr'
    case 'annual':
      return '/yr'
  }
}

export function safeDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null
  const date = d instanceof Date ? d : new Date(d)
  return Number.isNaN(date.getTime()) ? null : date
}

export function relativeDays(target: string | Date | null | undefined): string {
  const d = safeDate(target)
  if (!d) return '—'
  const diff = Math.round((d.getTime() - Date.now()) / 86_400_000)
  if (diff === 0) return 'today'
  if (diff > 0) return `in ${diff} day${diff === 1 ? '' : 's'}`
  const abs = Math.abs(diff)
  return `${abs} day${abs === 1 ? '' : 's'} ago`
}

export function shortDate(d: string | Date | null | undefined): string {
  const date = safeDate(d)
  if (!date) return '—'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function userDisplayName(u: {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
} | undefined | null): string {
  if (!u) return 'Unknown user'
  const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
  return name || u.email || u.phone || 'Unknown user'
}
