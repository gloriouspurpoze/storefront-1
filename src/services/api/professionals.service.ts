/**
 * ============================================================================
 * PROFESSIONALS API SERVICE
 * ============================================================================
 * API service for Professional management operations
 * 
 * @author CTO Team
 * @date November 7, 2025
 */

import { api } from './base'
import {
  Professional,
  CreateProfessionalData,
  UpdateProfessionalData,
  ProfessionalsQuery,
  ProfessionalsResponse,
  ProfessionalStats,
  UpdateVerificationData,
  UpdateAvailabilityData,
  SuspendProfessionalRequest,
  BlockProfessionalRequest,
} from '../../types/professional.types'

export class ProfessionalsService {
  /**
   * Get all professionals with filters
   */
  static async getProfessionals(query: ProfessionalsQuery = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/professionals${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<ProfessionalsResponse>(endpoint, {
      loadingMessage: 'Loading professionals...',
      showSuccessToast: false,
    })
  }

  /**
   * Get verified and available professionals
   */
  static async getAvailableProfessionals(query: ProfessionalsQuery = {}) {
    return this.getProfessionals({
      ...query,
      isVerified: true,
      availability: 'available',
    })
  }

  /**
   * Get single professional by ID
   */
  static async getProfessional(id: string) {
    return api.get<Professional>(`/professionals/${id}`, {
      loadingMessage: 'Loading professional...',
      showSuccessToast: false,
    })
  }

  /**
   * Get professionals by service provider
   */
  static async getProfessionalsByProvider(providerId: string) {
    return api.get<Professional[]>(`/professionals/provider/${providerId}`, {
      loadingMessage: 'Loading professionals...',
      showSuccessToast: false,
    })
  }

  /**
   * Get professional statistics
   */
  static async getProfessionalStats() {
    return api.get<ProfessionalStats>('/professionals/stats', {
      loadingMessage: 'Loading statistics...',
      showSuccessToast: false,
    })
  }

  /**
   * Create new professional
   */
  static async createProfessional(data: CreateProfessionalData) {
    return api.post<Professional>('/professionals', data, {
      loadingMessage: 'Creating professional...',
      successMessage: 'Professional created successfully!',
    })
  }

  /**
   * Update professional
   */
  static async updateProfessional(id: string, data: UpdateProfessionalData) {
    return api.put<Professional>(`/professionals/${id}`, data, {
      loadingMessage: 'Updating professional...',
      successMessage: 'Professional updated successfully!',
    })
  }

  /**
   * Update professional verification status
   */
  static async updateVerification(id: string, data: UpdateVerificationData) {
    return api.patch<Professional>(`/professionals/${id}/verification`, data, {
      loadingMessage: 'Updating verification...',
      successMessage: 'Verification updated successfully!',
    })
  }

  /**
   * Update professional availability
   */
  static async updateAvailability(id: string, data: UpdateAvailabilityData) {
    return api.patch<Professional>(`/professionals/${id}/availability`, data, {
      loadingMessage: 'Updating availability...',
      successMessage: 'Availability updated successfully!',
    })
  }

  /**
   * Delete professional
   */
  static async deleteProfessional(id: string) {
    return api.delete(`/professionals/${id}`, {
      loadingMessage: 'Deleting professional...',
      successMessage: 'Professional deleted successfully!',
    })
  }

  /**
   * Get professionals by service
   */
  static async getProfessionalsByService(serviceId: string, query: ProfessionalsQuery = {}) {
    return this.getProfessionals({
      ...query,
      service: serviceId,
    })
  }

  /**
   * Get professionals by category
   */
  static async getProfessionalsByCategory(category: string, query: ProfessionalsQuery = {}) {
    return this.getProfessionals({
      ...query,
      category,
    })
  }

  /**
   * Get professionals by city
   */
  static async getProfessionalsByCity(city: string, query: ProfessionalsQuery = {}) {
    return this.getProfessionals({
      ...query,
      city,
    })
  }

  /**
   * Bulk update professionals
   */
  static async bulkUpdateProfessionals(professionalIds: string[], updates: Partial<UpdateProfessionalData>) {
    return api.put('/professionals/bulk', {
      professionalIds,
      updates,
    }, {
      loadingMessage: 'Updating professionals...',
      successMessage: 'Professionals updated successfully!',
    })
  }

  /**
   * Bulk verify professionals
   */
  static async bulkVerifyProfessionals(professionalIds: string[]) {
    return api.post('/professionals/bulk-verify', {
      professionalIds,
    }, {
      loadingMessage: 'Verifying professionals...',
      successMessage: 'Professionals verified successfully!',
    })
  }

  /**
   * Optional audit timeline (backend). Returns empty events when route is not implemented (404).
   */
  static async getProfessionalActivity(
    id: string,
    query: { limit?: number; cursor?: string } = {},
  ) {
    const params = new URLSearchParams()
    if (query.limit != null) params.append('limit', String(query.limit))
    if (query.cursor) params.append('cursor', query.cursor)
    const qs = params.toString()
    try {
      return await api.get<{
        events: Array<{
          id: string
          occurredAt: string
          kind: string
          title: string
          description?: string
          bookingId?: string
        }>
        nextCursor?: string | null
      }>(`/professionals/${id}/activity${qs ? `?${qs}` : ''}`, {
        loadingMessage: 'Loading activity...',
        showSuccessToast: false,
      })
    } catch (err: unknown) {
      const status = (err as { status?: number }).status
      if (status === 404) {
        return {
          success: true as const,
          data: { events: [] as Array<{ id: string; occurredAt: string; kind: string; title: string; description?: string; bookingId?: string }>, nextCursor: null },
          message: 'Activity API not available',
        }
      }
      throw err
    }
  }

  /**
   * Suspend professional (temporary). Prefers POST /professionals/:id/suspend; falls back to deactivate when API returns 404.
   */
  static async suspendProfessional(id: string, body: SuspendProfessionalRequest) {
    try {
      return await api.post<Professional>(`/professionals/${id}/suspend`, body, {
        loadingMessage: 'Suspending professional...',
        successMessage: 'Professional suspended.',
      })
    } catch (err: any) {
      const status = err?.status
      if (status === 404) {
        return api.put<Professional>(
          `/professionals/${id}`,
          {
            isActive: false,
            availability: 'offline',
            moderationReason: body.reason,
            suspendedUntil: body.until ?? null,
            accountStatus: 'suspended',
          } as UpdateProfessionalData,
          {
            loadingMessage: 'Suspending professional...',
            successMessage: 'Professional deactivated (fallback — enable dedicated suspend API for full audit).',
          },
        )
      }
      throw err
    }
  }

  /**
   * Block professional. Prefers POST /professionals/:id/block; falls back to isActive false.
   */
  static async blockProfessional(id: string, body: BlockProfessionalRequest) {
    try {
      return await api.post<Professional>(`/professionals/${id}/block`, body, {
        loadingMessage: 'Blocking professional...',
        successMessage: 'Professional blocked.',
      })
    } catch (err: any) {
      const status = err?.status
      if (status === 404) {
        return api.put<Professional>(
          `/professionals/${id}`,
          {
            isActive: false,
            availability: 'offline',
            moderationReason: body.reason,
            accountStatus: 'blocked',
          } as UpdateProfessionalData,
          {
            loadingMessage: 'Blocking professional...',
            successMessage: 'Professional deactivated (fallback — enable dedicated block API for full audit).',
          },
        )
      }
      throw err
    }
  }

  /**
   * Reinstate professional after suspend/block. Prefers POST /professionals/:id/reinstate.
   */
  static async reinstateProfessional(id: string) {
    try {
      return await api.post<Professional>(
        `/professionals/${id}/reinstate`,
        {},
        {
          loadingMessage: 'Reinstating professional...',
          successMessage: 'Professional reinstated.',
        },
      )
    } catch (err: any) {
      const status = err?.status
      if (status === 404) {
        return api.put<Professional>(
          `/professionals/${id}`,
          {
            isActive: true,
            accountStatus: 'active',
            suspendedUntil: null,
            moderationReason: undefined,
          } as UpdateProfessionalData,
          {
            loadingMessage: 'Reinstating professional...',
            successMessage: 'Professional reactivated.',
          },
        )
      }
      throw err
    }
  }

  static async exportProfessionals(query: ProfessionalsQuery = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    return api.get(`/professionals/export${params.toString() ? `?${params.toString()}` : ''}`, {
      loadingMessage: 'Exporting professionals...',
      showSuccessToast: false,
    })
  }
}

