import { api } from './base'

/**
 * Providers Service
 * Handles all provider-related API calls
 */

export interface Provider {
  id: string
  user_id?: string
  businessName?: string
  business_name?: string
  email?: string
  phone?: string
  rating?: number
  total_reviews?: number
  totalJobs?: number
  verificationStatus?: string
  verification_status?: 'pending' | 'verified' | 'rejected'
  avatar?: string
  categories?: string[]
  services_offered?: string[]
  servicesOffered?: string[]
  service_areas?: string[]
  serviceAreas?: Array<{
    city: string
    areas?: string[]
    pincodes?: string[]
  }>
  years_experience?: number
  yearsExperience?: number
  bio?: string
  business_license?: string
  businessLicense?: string
  created_at?: string
  updated_at?: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
}

export interface CreateProviderData {
  business_name: string
  business_email: string
  business_phone: string
  business_address?: string
  business_license?: string
  business_logo?: string
  years_experience?: number
  bio?: string
  services_offered: string[]
  service_categories?: string[]
  service_areas: string[]
  working_days?: string[]
  time_slots?: string[]
  emergency_service?: boolean
  same_day_service?: boolean
  hourly_rate?: string
  minimum_job_charge?: string
  travel_charge?: string
  payment_methods?: string[]
  verification_status?: 'pending' | 'verified' | 'rejected'
  insurance_document?: string
  certification_documents?: string[]
  tax_id?: string
  is_active?: boolean
  accept_new_requests?: boolean
  auto_accept_requests?: boolean
  notification_email?: string
  notification_phone?: string
}

export interface UpdateProviderData {
  business_name?: string
  business_email?: string
  business_phone?: string
  business_address?: string
  business_license?: string
  business_logo?: string
  years_experience?: number
  bio?: string
  services_offered?: string[]
  service_categories?: string[]
  service_areas?: string[]
  working_days?: string[]
  time_slots?: string[]
  emergency_service?: boolean
  same_day_service?: boolean
  hourly_rate?: string
  minimum_job_charge?: string
  travel_charge?: string
  payment_methods?: string[]
  insurance_document?: string
  certification_documents?: string[]
  tax_id?: string
  is_active?: boolean
  accept_new_requests?: boolean
  auto_accept_requests?: boolean
  notification_email?: string
  notification_phone?: string
}

export interface ProvidersQuery {
  page?: number
  limit?: number
  city?: string
  category?: string
  verificationStatus?: string
  verification_status?: string
  isAvailable?: boolean
  search?: string
  status?: string
  experience?: string
  service_type?: string
  location?: string
}

export interface ProvidersResponse {
  providers?: Provider[]
  serviceProviders?: Provider[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ProviderStats {
  total_providers: number
  verified_providers: number
  pending_providers: number
  rejected_providers?: number
  average_rating: number
  total_services?: number
  total_bookings?: number
}

export interface UpdateVerificationStatusData {
  verification_status: 'pending' | 'verified' | 'rejected'
  rejection_reason?: string
  verified_by?: string
  verified_at?: string
}

export class ProvidersService {
  /**
   * Get all providers with filters
   */
  static async getProviders(query: ProvidersQuery = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/providers${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<ProvidersResponse>(endpoint, {
      loadingMessage: 'Loading providers...',
      showSuccessToast: false,
    })
  }

  /**
   * Get verified and active providers
   */
  static async getAvailableProviders(query: ProvidersQuery = {}) {
    return this.getProviders({
      ...query,
      verificationStatus: 'verified',
      isAvailable: true,
    })
  }

  /**
   * Get single provider by ID
   */
  static async getProvider(id: string) {
    return api.get<Provider>(`/providers/${id}`, {
      loadingMessage: 'Loading provider...',
      showSuccessToast: false,
    })
  }

  /**
   * Get provider by user ID
   */
  static async getProviderByUserId(userId: string) {
    return api.get<Provider>(`/providers/user/${userId}`, {
      loadingMessage: 'Loading provider...',
      showSuccessToast: false,
    })
  }

  /**
   * Get provider statistics
   */
  static async getProviderStats() {
    return api.get<ProviderStats>('/providers/stats', {
      loadingMessage: 'Loading statistics...',
      showSuccessToast: false,
    })
  }

  /**
   * Create new provider
   */
  static async createProvider(data: CreateProviderData) {
    return api.post<Provider>('/providers', data, {
      loadingMessage: 'Creating provider...',
      successMessage: 'Provider created successfully!',
    })
  }

  /**
   * Update provider
   */
  static async updateProvider(id: string, data: UpdateProviderData) {
    return api.put<Provider>(`/providers/${id}`, data, {
      loadingMessage: 'Updating provider...',
      successMessage: 'Provider updated successfully!',
    })
  }

  /**
   * Update provider verification status
   */
  static async updateVerificationStatus(id: string, data: UpdateVerificationStatusData) {
    return api.patch<Provider>(`/providers/${id}/verification-status`, data, {
      loadingMessage: 'Updating verification status...',
      successMessage: 'Verification status updated successfully!',
    })
  }

  /**
   * Delete provider
   */
  static async deleteProvider(id: string) {
    return api.delete(`/providers/${id}`, {
      loadingMessage: 'Deleting provider...',
      successMessage: 'Provider deleted successfully!',
    })
  }

  /**
   * Get providers by service category
   */
  static async getProvidersByCategory(category: string, query: ProvidersQuery = {}) {
    return this.getProviders({
      ...query,
      category,
    })
  }

  /**
   * Get providers by city
   */
  static async getProvidersByCity(city: string, query: ProvidersQuery = {}) {
    return this.getProviders({
      ...query,
      city,
    })
  }

  /**
   * Bulk update providers
   */
  static async bulkUpdateProviders(providerIds: string[], updates: Partial<UpdateProviderData>) {
    return api.put('/providers/bulk', {
      providerIds,
      updates,
    }, {
      loadingMessage: 'Updating providers...',
      successMessage: 'Providers updated successfully!',
    })
  }

  /**
   * Bulk verify providers
   */
  static async bulkVerifyProviders(providerIds: string[]) {
    return api.post('/providers/bulk-verify', {
      providerIds,
    }, {
      loadingMessage: 'Verifying providers...',
      successMessage: 'Providers verified successfully!',
    })
  }

  /**
   * Export providers to CSV
   */
  static async exportProviders(query: ProvidersQuery = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    return api.get(`/providers/export${params.toString() ? `?${params.toString()}` : ''}`, {
      loadingMessage: 'Exporting providers...',
      showSuccessToast: false,
    })
  }
}
