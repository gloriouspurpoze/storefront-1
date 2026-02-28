import { apiClient } from '../apiClient'

export interface PlatformService {
  id: string
  name: string
  slug: string
  description: string
  short_description?: string
  icon?: string
  image?: string
  category: string
  subcategory?: string
  service_type: 'fixed' | 'hourly' | 'consultation'
  duration?: string
  base_price?: number
  hourly_rate?: number
  consultation_fee?: number
  min_hours?: number
  max_hours?: number
  gst_percentage?: number
  tax_included?: boolean
  is_active: boolean
  is_featured: boolean
  is_popular?: boolean
  sort_order: number
  tags: string[]
  features: string[]
  requirements: string[]
  working_days: string[]
  time_slots: string[]
  advance_booking_hours?: number
  same_day_booking?: boolean
  emergency_service?: boolean
  emergency_charge?: number
  product_options: any[]
  service_areas: any[]
  metadata?: Record<string, any>
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  total_requests: number
  average_rating: number
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  
  // Customer-focused sections
  our_process?: Array<{
    step: number
    title: string
    description: string
  }>
  whats_included?: string[]
  whats_excluded?: string[]
  please_note?: string[]
  our_promises?: string[]
  faqs?: Array<{
    question: string
    answer: string
  }>
}

export interface GetPlatformServicesParams {
  page?: number
  limit?: number
  category?: string
  subcategory?: string
  service_type?: 'fixed' | 'hourly' | 'consultation'
  is_active?: boolean
  is_featured?: boolean
  is_popular?: boolean
  status?: 'draft' | 'published' | 'archived'
  emergency_service?: boolean
  search?: string
  sort_by?: 'name' | 'sort_order' | 'total_requests' | 'average_rating' | 'created_at' | 'base_price' | 'hourly_rate'
  sort_order?: 'asc' | 'desc'
}

export interface GetPlatformServicesResponse {
  services: PlatformService[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreatePlatformServiceRequest {
  name: string
  slug?: string
  description: string
  short_description?: string
  icon?: string
  image?: string
  category: string
  subcategory?: string
  service_type?: 'fixed' | 'hourly' | 'consultation'
  duration?: string
  base_price?: number
  hourly_rate?: number
  consultation_fee?: number
  min_hours?: number
  max_hours?: number
  gst_percentage?: number
  tax_included?: boolean
  is_active?: boolean
  is_featured?: boolean
  is_popular?: boolean
  sort_order?: number
  tags?: string[]
  features?: string[]
  requirements?: string[]
  working_days?: string[]
  time_slots?: string[]
  advance_booking_hours?: number
  same_day_booking?: boolean
  emergency_service?: boolean
  emergency_charge?: number
  product_options?: any[]
  service_areas?: any[]
  metadata?: Record<string, any>
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  status?: 'draft' | 'published' | 'archived'
  
  // Customer-focused sections
  our_process?: Array<{
    step: number
    title: string
    description: string
  }>
  whats_included?: string[]
  whats_excluded?: string[]
  please_note?: string[]
  our_promises?: string[]
  faqs?: Array<{
    question: string
    answer: string
  }>
}

export interface UpdatePlatformServiceRequest {
  name?: string
  slug?: string
  description?: string
  short_description?: string
  icon?: string
  image?: string
  category?: string
  subcategory?: string
  service_type?: 'fixed' | 'hourly' | 'consultation'
  duration?: string
  base_price?: number
  hourly_rate?: number
  consultation_fee?: number
  min_hours?: number
  max_hours?: number
  gst_percentage?: number
  tax_included?: boolean
  is_active?: boolean
  is_featured?: boolean
  is_popular?: boolean
  sort_order?: number
  tags?: string[]
  features?: string[]
  requirements?: string[]
  working_days?: string[]
  time_slots?: string[]
  advance_booking_hours?: number
  same_day_booking?: boolean
  emergency_service?: boolean
  emergency_charge?: number
  product_options?: any[]
  service_areas?: any[]
  metadata?: Record<string, any>
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  status?: 'draft' | 'published' | 'archived'
  
  // Customer-focused sections
  our_process?: Array<{
    step: number
    title: string
    description: string
  }>
  whats_included?: string[]
  whats_excluded?: string[]
  please_note?: string[]
  our_promises?: string[]
  faqs?: Array<{
    question: string
    answer: string
  }>
}

export interface PlatformServiceStats {
  total_services: number
  active_services: number
  featured_services: number
  total_requests: number
  average_rating: number
}

export const platformServicesService = {
  /**
   * Get all platform services with pagination and filtering
   */
  async getServices(params?: GetPlatformServicesParams): Promise<GetPlatformServicesResponse> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    const url = queryParams.toString() ? `/platform-services?${queryParams.toString()}` : '/platform-services'
    const response = await apiClient.get(url) as any
    
    // Handle the response structure: { data: { services, pagination } } or { services, pagination }
    const inner = response?.data
    if (inner?.services && inner?.pagination) {
      return inner
    }
    if (response?.services && response?.pagination) {
      return response
    }
    
    throw new Error('Invalid response structure from API')
  },

  /**
   * Get platform service by ID
   */
  async getServiceById(serviceId: string): Promise<PlatformService> {
    const response = await apiClient.get(`/platform-services/${serviceId}`, {
      showSuccessToast: false,
      showErrorToast: true
    }) as any
    // apiClient returns the full JSON response, not response.data
    return response.data.service
  },

  /**
   * Create a new platform service
   */
  async createService(data: CreatePlatformServiceRequest): Promise<PlatformService> {
    const response = await apiClient.post('/platform-services', data, {
      showSuccessToast: false,
      showErrorToast: true
    }) as any
    return response.data.service
  },

  /**
   * Update platform service
   */
  async updateService(serviceId: string, data: UpdatePlatformServiceRequest): Promise<PlatformService> {
    const response = await apiClient.put(`/platform-services/${serviceId}`, data, {
      showSuccessToast: false,
      showErrorToast: true
    }) as any
    return response.data.service
  },

  /**
   * Delete platform service
   */
  async deleteService(serviceId: string): Promise<void> {
    await apiClient.delete(`/platform-services/${serviceId}`)
  },

  /**
   * Get platform service statistics
   */
  async getServiceStats(): Promise<PlatformServiceStats> {
    const response = await apiClient.get('/platform-services/stats') as any
    
    // Handle the response structure
    if (response?.data) {
      return response.data
    }
    
    // Fallback if structure is different
    throw new Error('Invalid response structure from stats API')
  },

  /**
   * Get featured services
   */
  async getFeaturedServices(): Promise<PlatformService[]> {
    const response = await apiClient.get('/platform-services/featured') as any
    return response.data.data.services
  },

  /**
   * Get services by category
   */
  async getServicesByCategory(category: string): Promise<PlatformService[]> {
    const response = await apiClient.get(`/platform-services/category/${category}`) as any
    return response.data.data.services
  },

  /**
   * Save service as draft
   */
  async saveAsDraft(data: CreatePlatformServiceRequest): Promise<PlatformService> {
    const response = await apiClient.post('/platform-services/draft', data) as any
    return response.data.data.service
  },

  /**
   * Publish service
   */
  async publishService(serviceId: string): Promise<PlatformService> {
    const response = await apiClient.put(`/platform-services/${serviceId}/publish`) as any
    return response.data.data.service
  },

  /**
   * Unpublish service
   */
  async unpublishService(serviceId: string): Promise<PlatformService> {
    const response = await apiClient.put(`/platform-services/${serviceId}/unpublish`) as any
    return response.data.data.service
  },

  /**
   * Archive service
   */
  async archiveService(serviceId: string): Promise<PlatformService> {
    const response = await apiClient.put(`/platform-services/${serviceId}/archive`) as any
    return response.data.data.service
  },
}

