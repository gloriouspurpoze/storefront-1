import { apiClient } from '../apiClient'

/**
 * Homepage Section Types
 */
export interface HomepageSection {
  _id?: string
  id?: string
  sectionType: 'hero' | 'featured_services' | 'featured_products' | 'promotional_banners' | 'testimonials' | 'stats' | 'trust_badges' | 'cta_section' | 'features' | 'services' | 'statistics' | 'cta' | 'partners' | 'howitworks'
  title: string
  subtitle?: string
  description?: string
  content?: {
    description?: string
    cta?: {
      text: string
      link: string
      style?: 'primary' | 'secondary' | 'outline'
    }
    backgroundImage?: string
    images?: {
      desktop?: string
      mobile?: string
      thumbnail?: string
    }
    [key: string]: any
  }
  order?: number
  displayOrder?: number
  isActive: boolean
  settings?: Record<string, any>
  metadata?: {
    lastUpdatedBy?: string
    version?: number
  }
  createdAt?: string
  updatedAt?: string
}

export interface CreateHomepageSectionRequest {
  sectionType: HomepageSection['sectionType']
  title: string
  subtitle?: string
  description?: string
  content?: HomepageSection['content']
  order?: number
  displayOrder?: number
  isActive?: boolean
  settings?: Record<string, any>
}

export interface UpdateHomepageSectionRequest {
  title?: string
  subtitle?: string
  description?: string
  content?: HomepageSection['content']
  order?: number
  displayOrder?: number
  isActive?: boolean
  settings?: Record<string, any>
}

export interface HomepageSectionsResponse {
  sections: HomepageSection[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface HomepageSectionsQuery {
  page?: number
  limit?: number
  isActive?: boolean
  sectionType?: string
  search?: string
  sort_by?: 'order' | 'createdAt' | 'updatedAt' | 'title'
  sort_order?: 'asc' | 'desc'
}

/**
 * Homepage Service
 * Production-ready service for homepage section management
 * Follows the established apiClient pattern for consistency
 */
export class HomepageService {
  /**
   * Get all homepage sections with pagination and filtering
   */
  static async getHomepageSections(query: HomepageSectionsQuery = {}) {
    const params: Record<string, string> = {}
    
    if (query.page) params.page = query.page.toString()
    if (query.limit) params.limit = query.limit.toString()
    if (query.isActive !== undefined) params.isActive = query.isActive.toString()
    if (query.sectionType) params.type = query.sectionType
    if (query.search) params.search = query.search
    if (query.sort_by) params.sort_by = query.sort_by
    if (query.sort_order) params.sort_order = query.sort_order

    const response = await apiClient.get<HomepageSectionsResponse | { data: HomepageSectionsResponse }>('/cms/admin/homepage', {
      params,
      showLoading: true,
      loadingMessage: 'Loading homepage sections...',
      showSuccessToast: false,
      showErrorToast: true,
      errorMessage: 'Failed to load homepage sections',
    })
    
    // Handle both response formats: { data: {...} } or direct response
    return (response as any).data || response
  }

  /**
   * Get active homepage content (for public website)
   */
  static async getActiveHomepageContent() {
    return apiClient.get<Record<string, HomepageSection>>('/cms/public/homepage', {
      showLoading: false,
      showSuccessToast: false,
      showErrorToast: false,
    })
  }

  /**
   * Get a single homepage section by ID
   */
  static async getHomepageSectionById(id: string) {
    const response = await apiClient.get<{ section: HomepageSection } | { data: { section: HomepageSection } }>(`/cms/admin/homepage/${id}`, {
      showLoading: true,
      loadingMessage: 'Loading section...',
      showSuccessToast: false,
      showErrorToast: true,
      errorMessage: 'Failed to load homepage section',
    })
    
    // Handle both response formats: { data: {...} } or direct response
    return (response as any).data || response
  }

  /**
   * Create a new homepage section
   */
  static async createHomepageSection(data: CreateHomepageSectionRequest) {
    const payload = {
      ...data,
      order: data.order ?? data.displayOrder ?? 0,
      displayOrder: data.displayOrder ?? data.order ?? 0,
    }

    const response = await apiClient.post<{ section: HomepageSection } | { data: { section: HomepageSection } }>('/cms/admin/homepage', payload, {
      showLoading: true,
      loadingMessage: 'Creating homepage section...',
      showSuccessToast: true,
      successMessage: 'Homepage section created successfully',
      showErrorToast: true,
      errorMessage: 'Failed to create homepage section',
    })
    
    return (response as any).data || response
  }

  /**
   * Update an existing homepage section
   */
  static async updateHomepageSection(id: string, data: UpdateHomepageSectionRequest) {
    const payload = {
      ...data,
      order: data.order ?? data.displayOrder,
      displayOrder: data.displayOrder ?? data.order,
    }

    const response = await apiClient.put<{ section: HomepageSection } | { data: { section: HomepageSection } }>(`/cms/admin/homepage/${id}`, payload, {
      showLoading: true,
      loadingMessage: 'Updating homepage section...',
      showSuccessToast: true,
      successMessage: 'Homepage section updated successfully',
      showErrorToast: true,
      errorMessage: 'Failed to update homepage section',
    })
    
    return (response as any).data || response
  }

  /**
   * Delete a homepage section
   */
  static async deleteHomepageSection(id: string) {
    return apiClient.delete<{ message: string }>(`/cms/admin/homepage/${id}`, {
      showLoading: true,
      loadingMessage: 'Deleting homepage section...',
      showSuccessToast: true,
      successMessage: 'Homepage section deleted successfully',
      showErrorToast: true,
      errorMessage: 'Failed to delete homepage section',
    })
  }

  /**
   * Toggle homepage section active status
   */
  static async toggleSectionStatus(id: string, isActive: boolean) {
    return apiClient.patch<{ section: HomepageSection }>(`/cms/admin/homepage/${id}`, { isActive }, {
      showLoading: true,
      loadingMessage: 'Updating section status...',
      showSuccessToast: true,
      successMessage: `Section ${isActive ? 'activated' : 'deactivated'} successfully`,
      showErrorToast: true,
      errorMessage: 'Failed to update section status',
    })
  }

  /**
   * Reorder homepage sections
   */
  static async reorderSections(sections: Array<{ id: string; order: number }>) {
    return apiClient.put<{ sections: HomepageSection[] }>('/cms/admin/homepage/reorder', { sections }, {
      showLoading: true,
      loadingMessage: 'Reordering sections...',
      showSuccessToast: true,
      successMessage: 'Sections reordered successfully',
      showErrorToast: true,
      errorMessage: 'Failed to reorder sections',
    })
  }
}

