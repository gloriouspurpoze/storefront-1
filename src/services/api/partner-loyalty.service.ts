import { api } from './base'
import type {
  PartnerLoyaltyConfigDto,
  PartnerLoyaltyRecalculateResult,
  PartnerLoyaltyRosterResponse,
  PartnerLoyaltyRosterRow,
} from '../../types/partner-loyalty.types'
import type { PartnerLoyaltyTier } from '../../lib/partnerLoyaltyScore'

const silent = { showSuccessToast: false, showLoading: false } as const

export class PartnerLoyaltyService {
  static getConfig() {
    return api.get<PartnerLoyaltyConfigDto>('/partner-loyalty/config', silent)
  }

  static putConfig(body: Partial<PartnerLoyaltyConfigDto>) {
    return api.put<PartnerLoyaltyConfigDto>('/partner-loyalty/config', body, {
      successMessage: 'Partner loyalty settings saved.',
      loadingMessage: 'Saving…',
    })
  }

  static listRoster(params?: {
    page?: number
    limit?: number
    tier?: PartnerLoyaltyTier
    sortBy?: 'score' | 'rating' | 'jobs'
  }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.tier) q.set('tier', params.tier)
    if (params?.sortBy) q.set('sortBy', params.sortBy)
    const qs = q.toString()
    return api.get<PartnerLoyaltyRosterResponse>(`/partner-loyalty/roster${qs ? `?${qs}` : ''}`, silent)
  }

  static recalculateAll(limit = 200) {
    return api.post<PartnerLoyaltyRecalculateResult>(
      '/partner-loyalty/recalculate',
      { limit },
      {
        successMessage: 'Loyalty tiers recalculated.',
        loadingMessage: 'Recalculating…',
      },
    )
  }

  static recalculateOne(id: string) {
    return api.post<PartnerLoyaltyRosterRow>(
      `/partner-loyalty/professionals/${id}/recalculate`,
      {},
      { successMessage: 'Tier updated for this partner.' },
    )
  }

  static getProfessional(id: string) {
    return api.get<PartnerLoyaltyRosterRow>(`/partner-loyalty/professionals/${id}`, silent)
  }
}
