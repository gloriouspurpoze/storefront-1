import { apiClient } from '../apiClient'
import type {
  Slider,
  CreateSliderRequest,
  UpdateSliderRequest,
  SlidersResponse,
  SlidersQuery,
} from '../../types'

/**
 * Sliders Service
 * Handles all slider/banner-related API calls
 */
export class SlidersService {
  /**
   * Get sliders with pagination and filters
   */
  static async getSliders(query: SlidersQuery = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/cms/admin/sliders${params.toString() ? `?${params.toString()}` : ''}`
    
    const response = await apiClient.get(endpoint) as any

    // Transform the response to match our expected structure
    if (response.data?.sliders) {
      return {
        ...response,
        data: {
          sliders: response.data.sliders,
          pagination: response.data.pagination
        }
      }
    }

    return response
  }

  /**
   * Get single slider by ID
   */
  static async getSlider(id: string) {
    const response = await apiClient.get(`/cms/admin/sliders/${id}`) as any

    // Transform the response to match our expected structure
    if (response.data?.slider) {
      return {
        ...response,
        data: response.data.slider
      }
    }

    return response
  }

  /**
   * Create new slider
   */
  static async createSlider(slider: CreateSliderRequest) {
    const response = await apiClient.post('/cms/admin/sliders', slider) as any

    // Transform the response to match our expected structure
    if (response.data?.slider) {
      return {
        ...response,
        data: response.data.slider
      }
    }

    return response
  }

  /**
   * Update existing slider
   */
  static async updateSlider(id: string, slider: UpdateSliderRequest) {
    const response = await apiClient.put(`/cms/admin/sliders/${id}`, slider) as any

    // Transform the response to match our expected structure
    if (response.data?.slider) {
      return {
        ...response,
        data: response.data.slider
      }
    }

    return response
  }

  /**
   * Delete slider
   */
  static async deleteSlider(id: string) {
    return apiClient.delete(`/cms/admin/sliders/${id}`)
  }

  /**
   * Update slider position
   */
  static async updateSliderPosition(id: string, position: number) {
    return apiClient.patch(`/cms/admin/sliders/${id}/position`, { position })
  }

  /**
   * Toggle slider active status
   */
  static async toggleSliderStatus(id: string, is_active: boolean) {
    return apiClient.patch(`/cms/admin/sliders/${id}/status`, { is_active })
  }

  /**
   * Get active sliders for client side
   */
  static async getActiveSliders() {
    const response = await apiClient.get('/cms/admin/sliders/active') as any

    // Transform the response to match our expected structure
    if (response.data?.sliders) {
      return {
        ...response,
        data: response.data.sliders
      }
    }

    return response
  }

  /**
   * Get slider statistics
   */
  static async getSliderStats() {
    const response = await apiClient.get('/cms/admin/sliders/stats') as any

    // Transform the response to match our expected structure
    if (response.data?.stats) {
      return {
        ...response,
        data: response.data.stats
      }
    }

    return response
  }
}
