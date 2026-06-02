import type { ApiClient } from '../types'
import { unwrapApiData } from '../unwrap'

export interface PlatformEarningsSummary {
  totalBookingAmount: number
  totalPlatformCommission: number
  totalProfessionalEarnings: number
  totalBookings: number
  pendingPayments: number
  verifiedPayments: number
  pendingPayouts: number
  paidPayouts: number
  cashInHand: number
  outstandingToProvider: number
}

export interface AdminPayout {
  _id: string
  payoutReference: string
  professionalId:
    | {
        firstName?: string
        lastName?: string
        phoneNumber?: string
      }
    | string
    | null
  grossAmount: number
  tdsAmount: number
  deductions: number
  netAmount: number
  payoutMethod: string
  status: string
  requestedAt: string
  approvedAt?: string
  completedAt?: string
  notes?: string
  firstApprovedBy?: unknown
  secondApprovedBy?: unknown
}

function emptySummary(): PlatformEarningsSummary {
  return {
    totalBookingAmount: 0,
    totalPlatformCommission: 0,
    totalProfessionalEarnings: 0,
    totalBookings: 0,
    pendingPayments: 0,
    verifiedPayments: 0,
    pendingPayouts: 0,
    paidPayouts: 0,
    cashInHand: 0,
    outstandingToProvider: 0,
  }
}

function payoutsFromPayload(data: unknown): AdminPayout[] {
  if (Array.isArray(data)) return data as AdminPayout[]
  if (data && typeof data === 'object' && Array.isArray((data as { payouts?: unknown[] }).payouts)) {
    return (data as { payouts: AdminPayout[] }).payouts
  }
  return []
}

export function createEarningsService(api: ApiClient) {
  const base = '/earnings/admin'

  return {
    async getPlatformSummary(): Promise<PlatformEarningsSummary> {
      const res = await api.get<unknown>(`${base}/platform-summary`)
      const data = unwrapApiData<Partial<PlatformEarningsSummary>>(res.data ?? res)
      return { ...emptySummary(), ...(data ?? {}) }
    },
    async getPayouts(status: string): Promise<AdminPayout[]> {
      try {
        const res = await api.get<unknown>(`${base}/payouts`, { params: { status } })
        return payoutsFromPayload(unwrapApiData(res.data ?? res))
      } catch {
        return []
      }
    },
    async getPendingPayouts(): Promise<AdminPayout[]> {
      const [pending, requested] = await Promise.all([
        this.getPayouts('pending'),
        this.getPayouts('requested'),
      ])
      const map = new Map<string, AdminPayout>()
      for (const p of [...pending, ...requested]) {
        if (p?._id) map.set(p._id, p)
      }
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime(),
      )
    },
    async approvePayout(payoutId: string): Promise<{ message?: string }> {
      const res = await api.post<unknown>(`${base}/payouts/${payoutId}/approve`, {})
      return unwrapApiData(res.data ?? res)
    },
  }
}

export type EarningsService = ReturnType<typeof createEarningsService>
