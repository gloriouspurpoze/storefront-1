import { apiClient } from '../apiClient'

export type ProductRelationType = 'required' | 'recommended' | 'optional' | 'alternative'

/** Junction-table link sent on create/update and returned on GET. */
export interface ServiceProductLinkInput {
  product_id: string
  relation_type?: ProductRelationType
  display_order?: number
}

export interface PlatformService {
  id: string
  name: string
  slug: string
  description: string
  short_description?: string
  icon?: string
  image?: string
  /** Gallery URLs; `image` is the mobile card hero */
  images?: string[]
  /** May be slug or id depending on API transform; prefer `category_id` for writes. */
  category: string
  category_id?: string
  subcategory?: string
  subcategory_id?: string
  service_type: 'fixed' | 'hourly' | 'consultation'
  duration?: string
  base_price?: number
  /** Anchored MRP / list price for strike-through on customer app. */
  original_price?: number
  /** Server-computed from base vs MRP (1–99). */
  discount_percentage?: number
  /** Server-computed ₹ saved. */
  savings_amount?: number
  hourly_rate?: number
  consultation_fee?: number
  min_hours?: number
  max_hours?: number
  gst_percentage?: number
  tax_included?: boolean
  is_active: boolean
  is_featured: boolean
  is_popular?: boolean
  review_count?: number
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
  /** Live count of bookings that have been completed for this service. */
  total_bookings?: number
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

  /** Backend-derived addons (junction-table populated). Same payload returned under `addons` too. */
  serviceAddons?: Array<{
    id: string
    name: string
    price: number
    description?: string
    slug?: string
    priceType?: 'fixed' | 'per_unit' | 'percentage'
    sortOrder?: number
    isPopular?: boolean
  }>
  /** Junction-table linked products (recommended/required upsells). */
  relatedProducts?: Array<{
    id: string
    product_id: string
    relation_type?: 'required' | 'recommended' | 'optional' | 'alternative'
    display_order?: number
    product?: {
      id: string
      name: string
      slug?: string
      brand?: string
      price?: number
      image?: string
      sku?: string
    }
  }>
  /** Structured links for admin rehydration (relation + display order). */
  selected_products?: ServiceProductLinkInput[]
  /** Bookable packages (ServiceVariant rows). */
  serviceVariants?: Array<{
    id?: string
    _id?: string
    name?: string
    price?: number
    original_price?: number
    description?: string
    isPopular?: boolean
    isDefault?: boolean
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
  images?: string[]
  category: string
  subcategory?: string
  service_type?: 'fixed' | 'hourly' | 'consultation'
  duration?: string
  base_price?: number
  original_price?: number | null
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
  service_addons?: Array<{ name?: string; price?: string | number; description?: string }>
  /** Catalog product links (ObjectId strings or rich link objects). */
  selected_products?: Array<string | ServiceProductLinkInput>
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
  images?: string[]
  category?: string
  subcategory?: string
  service_type?: 'fixed' | 'hourly' | 'consultation'
  duration?: string
  base_price?: number
  original_price?: number | null
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
  service_addons?: Array<{ name?: string; price?: string | number; description?: string }>
  /** Catalog product links (ObjectId strings or rich link objects). */
  selected_products?: Array<string | ServiceProductLinkInput>
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
  /**
   * Sum of denormalized `totalRequests` across every PlatformService.
   * NOTE: this can drift from real bookings if seed values were ever set —
   * run `/stats/recompute` to align with the Booking collection.
   */
  total_requests: number
  /** Sum of denormalized `totalBookings` (completed) across services. */
  total_bookings?: number
  /** Sum of denormalized `reviewCount` across services. */
  total_reviews?: number
  /** Ground truth — distinct bookings that include a platform service. */
  real_total_bookings?: number
  /** Ground truth — bookings that include a service AND are status=completed. */
  real_completed_bookings?: number
  average_rating: number
}

function unwrapPlatformServicesList(response: unknown): PlatformService[] {
  if (!response || typeof response !== 'object') return []
  const root = response as Record<string, unknown>
  const data = root.data
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (Array.isArray(d.services)) return d.services as PlatformService[]
    const nested = d.data
    if (nested && typeof nested === 'object' && Array.isArray((nested as Record<string, unknown>).services)) {
      return (nested as Record<string, unknown>).services as PlatformService[]
    }
  }
  if (Array.isArray(root.services)) return root.services as PlatformService[]
  return []
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

  /** Batch-update sort_order without per-item toasts (catalog drag-and-drop). */
  async reorderServices(updates: { id: string; sort_order: number }[]): Promise<void> {
    if (!updates.length) return
    await Promise.all(
      updates.map(({ id, sort_order }) =>
        apiClient.put(`/platform-services/${id}`, { sort_order }, {
          showSuccessToast: false,
          showErrorToast: false,
          showLoading: false,
        }),
      ),
    )
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
   * Recompute `total_requests` and `total_bookings` for every (or selected)
   * platform service from real Booking data. Wipes legacy seed placeholders.
   */
  async recomputeBookingStats(serviceIds?: string[]): Promise<{
    servicesUpdated: number
    servicesReset: number
    generatedAt: string
  }> {
    const response = await apiClient.post(
      '/platform-services/stats/recompute',
      serviceIds && serviceIds.length > 0 ? { service_ids: serviceIds } : {},
      { showSuccessToast: false, showErrorToast: true },
    ) as any
    return response?.data ?? { servicesUpdated: 0, servicesReset: 0, generatedAt: new Date().toISOString() }
  },

  /**
   * Get featured services
   */
  async getFeaturedServices(): Promise<PlatformService[]> {
    const response = await apiClient.get('/platform-services/featured', {
      showSuccessToast: false,
      showLoading: false,
    }) as unknown
    return unwrapPlatformServicesList(response)
  },

  /**
   * Get services by category slug or id (`/platform-services/category/:key`).
   */
  async getServicesByCategory(category: string): Promise<PlatformService[]> {
    const key = encodeURIComponent(category.trim())
    if (!key) return []
    const response = await apiClient.get(`/platform-services/category/${key}`, {
      showSuccessToast: false,
      showLoading: false,
      showErrorToast: false,
    }) as unknown
    return unwrapPlatformServicesList(response)
  },

  /**
   * Resolve bookable services for a category — tries Mongo id, catalog slug, and list API fallbacks.
   */
  async listServicesForCategoryKeys(keys: string[]): Promise<PlatformService[]> {
    const seenKeys = new Set<string>()
    const candidates = keys.map((k) => k.trim()).filter(Boolean)
    for (const key of candidates) {
      const norm = key.toLowerCase()
      if (seenKeys.has(norm)) continue
      seenKeys.add(norm)
      try {
        const fromRoute = await this.getServicesByCategory(key)
        if (fromRoute.length > 0) return fromRoute
      } catch {
        /* try next key */
      }
    }
    for (const key of candidates) {
      const norm = key.toLowerCase()
      if (seenKeys.has(`list:${norm}`)) continue
      seenKeys.add(`list:${norm}`)
      try {
        const res = await this.getServices({
          page: 1,
          limit: 500,
          category: key,
          is_active: true,
        })
        if (res.services?.length) return res.services
      } catch {
        /* try next */
      }
    }
    return []
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

  /**
   * Deactivate every active platform service matching category (and optional subcategory).
   * Re-fetches page 1 until no active matches remain — safe for large catalogs.
   * Used when a category or subcategory is set inactive so services follow the same visibility.
   */
  async deactivateServicesMatching(params: {
    category: string
    subcategory?: string
  }): Promise<{ deactivatedCount: number }> {
    const category = String(params.category ?? '').trim().toLowerCase()
    if (!category) return { deactivatedCount: 0 }
    const subcategory = params.subcategory?.trim().toLowerCase()

    let deactivatedCount = 0
    const limit = 100
    let safety = 0
    const maxLoops = 500

    while (safety < maxLoops) {
      safety += 1
      const query: GetPlatformServicesParams = {
        page: 1,
        limit,
        category,
        is_active: true,
        sort_by: 'sort_order',
        sort_order: 'asc',
      }
      if (subcategory) query.subcategory = subcategory

      const res = await this.getServices(query)
      const batch = res.services ?? []
      if (batch.length === 0) break

      for (const s of batch) {
        if (!s.is_active) continue
        try {
          await this.updateService(s.id, { is_active: false })
          deactivatedCount += 1
        } catch {
          // Continue other rows; caller may retry or inspect logs
        }
      }
    }

    return { deactivatedCount }
  },
}

