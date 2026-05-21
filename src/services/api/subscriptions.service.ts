/**
 * Subscriptions Service — admin CRUD on plans + subscriber lifecycle.
 * Backed by `/api/admin/subscriptions` and `/api/subscriptions` (public).
 */

import { api } from './base'

const silentRead = { showSuccessToast: false, showLoading: false } as const

/* -------------------------------- types -------------------------------- */

export type PlanType = 'customer' | 'provider'
export type BillingCycle = 'monthly' | 'quarterly' | 'annual'
export type PlanStatus = 'active' | 'inactive' | 'archived'

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'paused'

export interface PlanBenefits {
  discountPercentage?: number
  priorityBooking?: boolean
  freeCancellations?: number | 'unlimited'
  freeInspections?: number
  dedicatedManager?: boolean
  emergencySupport?: boolean
  extendedWarranty?: boolean
  familyMembers?: number
  enhancedProfile?: boolean
  topListings?: boolean
  freeLeadsPerDay?: number
  analytics?: boolean
  apiAccess?: boolean
  teamMembers?: number
}

export interface PlanLimitations {
  maxBookingsPerMonth?: number
  maxOrdersPerMonth?: number
  serviceCategories?: string[]
}

export interface SubscriptionPlan {
  _id: string
  name: string
  slug: string
  type: PlanType
  description: string
  price: number // paise
  priceInRupees: number
  billingCycle: BillingCycle
  features: string[]
  benefits: PlanBenefits
  limitations?: PlanLimitations
  trialDays?: number
  isPopular?: boolean
  sortOrder: number
  status: PlanStatus
  activeSubscribers?: number
  createdAt?: string
  updatedAt?: string
}

export interface PlanInput {
  name: string
  slug: string
  type: PlanType
  description: string
  price: number // paise
  billingCycle: BillingCycle
  features: string[]
  benefits: PlanBenefits
  limitations?: PlanLimitations
  trialDays?: number
  isPopular?: boolean
  sortOrder?: number
  status?: PlanStatus
}

export interface SubscriberPlanSummary {
  _id?: string
  name?: string
  slug?: string
  price?: number
  billingCycle?: BillingCycle
  type?: PlanType
}

export interface SubscriberUserSummary {
  _id?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

export interface SubscriberRow {
  _id: string
  userId: string | SubscriberUserSummary
  planId: string | SubscriberPlanSummary
  status: SubscriptionStatus
  startDate: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelledAt?: string
  trialEnd?: string
  paymentMethod?: string
  daysUntilRenewal?: number
  usageStats?: {
    bookingsThisMonth?: number
    ordersThisMonth?: number
    creditsEarned?: number
  }
  metadata?: Record<string, unknown>
  cancelReason?: string
  createdAt?: string
  updatedAt?: string
}

export interface SubscriberListResponse {
  subscriptions: SubscriberRow[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface SubscriberFilters {
  status?: SubscriptionStatus
  planId?: string
  userId?: string
  search?: string
  page?: number
  limit?: number
}

export interface SubscriptionStats {
  counts: { active: number; trial: number; pastDue: number; paused: number }
  mrrPaise: number
  mrrInRupees: number
  arrPaise: number
  arrInRupees: number
  newLast30: number
  cancelledLast30: number
  cancelledPrev30: number
  churnRate30dPct: number
  breakdownByPlan: Array<{
    planId: string
    name: string
    type: PlanType
    subscribers: number
    revenuePaise: number
    revenueInRupees: number
  }>
}

/* ------------------------------ admin API ------------------------------ */

export const SubscriptionsService = {
  // Plans
  async listPlans(filters: {
    type?: PlanType
    status?: PlanStatus
    search?: string
  } = {}): Promise<{ plans: SubscriptionPlan[] }> {
    const res = await api.get<{ plans: SubscriptionPlan[] }>(
      '/admin/subscriptions/plans',
      { params: filters, ...silentRead }
    )
    return res.data
  },

  async getPlan(id: string): Promise<SubscriptionPlan> {
    const res = await api.get<SubscriptionPlan>(
      `/admin/subscriptions/plans/${encodeURIComponent(id)}`,
      silentRead
    )
    return res.data
  },

  async createPlan(payload: PlanInput): Promise<SubscriptionPlan> {
    const res = await api.post<SubscriptionPlan>(
      '/admin/subscriptions/plans',
      payload,
      { successMessage: 'Subscription plan created' }
    )
    return res.data
  },

  async updatePlan(id: string, payload: Partial<PlanInput>): Promise<SubscriptionPlan> {
    const res = await api.put<SubscriptionPlan>(
      `/admin/subscriptions/plans/${encodeURIComponent(id)}`,
      payload,
      { successMessage: 'Subscription plan updated' }
    )
    return res.data
  },

  async setPlanStatus(id: string, status: PlanStatus): Promise<SubscriptionPlan> {
    const res = await api.patch<SubscriptionPlan>(
      `/admin/subscriptions/plans/${encodeURIComponent(id)}/status`,
      { status },
      { successMessage: `Plan ${status}` }
    )
    return res.data
  },

  async deletePlan(id: string): Promise<void> {
    await api.delete<void>(
      `/admin/subscriptions/plans/${encodeURIComponent(id)}`,
      { successMessage: 'Plan removed (archived if in use)' }
    )
  },

  // Subscribers
  async listSubscribers(filters: SubscriberFilters = {}): Promise<SubscriberListResponse> {
    const res = await api.get<SubscriberListResponse>(
      '/admin/subscriptions',
      { params: filters, ...silentRead }
    )
    return res.data
  },

  async getSubscriber(id: string): Promise<SubscriberRow> {
    const res = await api.get<SubscriberRow>(
      `/admin/subscriptions/${encodeURIComponent(id)}`,
      silentRead
    )
    return res.data
  },

  async cancelSubscriber(id: string, opts: { immediate?: boolean; reason?: string } = {}) {
    const res = await api.post<SubscriberRow>(
      `/admin/subscriptions/${encodeURIComponent(id)}/cancel`,
      opts,
      { successMessage: opts.immediate ? 'Cancelled immediately' : 'Will cancel at period end' }
    )
    return res.data
  },

  async pauseSubscriber(id: string) {
    const res = await api.post<SubscriberRow>(
      `/admin/subscriptions/${encodeURIComponent(id)}/pause`,
      {},
      { successMessage: 'Subscription paused' }
    )
    return res.data
  },

  async resumeSubscriber(id: string) {
    const res = await api.post<SubscriberRow>(
      `/admin/subscriptions/${encodeURIComponent(id)}/resume`,
      {},
      { successMessage: 'Subscription resumed' }
    )
    return res.data
  },

  async extendSubscriber(id: string, days: number) {
    const res = await api.post<SubscriberRow>(
      `/admin/subscriptions/${encodeURIComponent(id)}/extend`,
      { days },
      { successMessage: `Extended by ${days} day${days === 1 ? '' : 's'}` }
    )
    return res.data
  },

  async changeSubscriberPlan(id: string, newPlanId: string) {
    const res = await api.post<SubscriberRow>(
      `/admin/subscriptions/${encodeURIComponent(id)}/change-plan`,
      { newPlanId },
      { successMessage: 'Plan changed' }
    )
    return res.data
  },

  // Stats
  async stats(): Promise<SubscriptionStats> {
    const res = await api.get<SubscriptionStats>(
      '/admin/subscriptions/stats',
      silentRead
    )
    return res.data
  },
}

export default SubscriptionsService
