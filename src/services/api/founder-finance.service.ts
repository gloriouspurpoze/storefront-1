import { api } from './base'
import type {
  CreateFounderCacBody,
  FounderAttributionBreakdown,
  FounderCacEntry,
  FounderCacSummary,
  FounderCityPnlRow,
  FounderPnlGranularity,
  FounderPnlRow,
  FounderProviderCostRow,
  FounderProviderLeaderboardRow,
  FounderLeaderboardSortBy,
  UpdateFounderCacBody,
} from '../../types/founder-finance.types'

const silent = { showSuccessToast: false, showLoading: false } as const

export class FounderFinanceService {
  static getPnl(params: { from: string; to: string; granularity?: FounderPnlGranularity }) {
    const q = new URLSearchParams({
      from: params.from,
      to: params.to,
      ...(params.granularity ? { granularity: params.granularity } : {}),
    })
    return api.get<FounderPnlRow[]>(`/finance/founder/pnl?${q}`, silent)
  }

  static getCityPnl(params: { from: string; to: string }) {
    const q = new URLSearchParams({ from: params.from, to: params.to })
    return api.get<FounderCityPnlRow[]>(`/finance/founder/city-pnl?${q}`, silent)
  }

  static listCac(params?: { month?: string }) {
    const q = new URLSearchParams()
    if (params?.month) q.set('month', params.month)
    const qs = q.toString()
    return api.get<FounderCacEntry[]>(`/finance/founder/cac${qs ? `?${qs}` : ''}`, silent)
  }

  static getCacSummary(params: { from: string; to: string }) {
    const q = new URLSearchParams({ from: params.from, to: params.to })
    return api.get<FounderCacSummary>(`/finance/founder/cac/summary?${q}`, silent)
  }

  /**
   * Auto-attribution breakdown — customer signups by first-touch channel
   * (UTM / gclid / fbclid / referrer captured by the customer site).
   * Includes `direct` and `social_organic` buckets that don't have a CAC
   * spend equivalent but matter for understanding acquisition mix.
   */
  static getCacAttribution(params: { from: string; to: string }) {
    const q = new URLSearchParams({ from: params.from, to: params.to })
    return api.get<FounderAttributionBreakdown>(`/finance/founder/cac/attribution?${q}`, silent)
  }

  static createCac(body: CreateFounderCacBody) {
    return api.post<FounderCacEntry>('/finance/founder/cac', body, {
      successMessage: 'CAC entry saved.',
      loadingMessage: 'Saving…',
    })
  }

  static updateCac(id: string, body: UpdateFounderCacBody) {
    return api.patch<FounderCacEntry>(`/finance/founder/cac/${id}`, body, {
      successMessage: 'CAC entry updated.',
    })
  }

  static deleteCac(id: string) {
    return api.delete<void>(`/finance/founder/cac/${id}`, {
      successMessage: 'CAC entry removed.',
    })
  }

  static getProviderLeaderboard(params: {
    from: string
    to: string
    sortBy?: FounderLeaderboardSortBy
    limit?: number
  }) {
    const q = new URLSearchParams({ from: params.from, to: params.to })
    if (params.sortBy) q.set('sortBy', params.sortBy)
    if (params.limit != null) q.set('limit', String(params.limit))
    return api.get<FounderProviderLeaderboardRow[]>(`/finance/founder/provider-leaderboard?${q}`, silent)
  }

  static getProviderCost(params: { from: string; to: string }) {
    const q = new URLSearchParams({ from: params.from, to: params.to })
    return api.get<FounderProviderCostRow[]>(`/finance/founder/provider-cost?${q}`, silent)
  }
}
