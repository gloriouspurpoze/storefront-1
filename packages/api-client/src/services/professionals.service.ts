import type { ApiClient } from '../types'
import type {
  Professional,
  ProfessionalLiveLocationRow,
  ProfessionalsQuery,
  ProfessionalsResponse,
} from '@profixer/types'

export function createProfessionalsService(api: ApiClient) {
  return {
    getProfessionals: (query: ProfessionalsQuery = {}) =>
      api.get<ProfessionalsResponse>('/professionals', { params: query as Record<string, unknown> }),
    getProfessional: (id: string) => api.get<Professional>(`/professionals/${id}`),
    getLiveLocationsForAdmin: () =>
      api.get<ProfessionalLiveLocationRow[]>('/professionals/admin/live-locations'),
    getMyProfile: () => api.get<Professional>('/professionals/profile'),
  }
}

export type ProfessionalsService = ReturnType<typeof createProfessionalsService>
