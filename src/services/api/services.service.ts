import { apiClient } from '../apiClient'
import type { ServiceProvider } from '../../types'

export interface ServiceRequest {
  id: string
  customer_id: string
  service_type: string
  title: string
  description: string
  location: {
    city: string
    state: string
    address: string
    zip_code: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  urgency: 'low' | 'medium' | 'high'
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  budget_min: string
  budget_max: string
  preferred_date?: string
  images?: string[]
  created_at: string
  updated_at?: string
  customer?: {
    firstName: string
    lastName: string
    email: string
    phone: string
    profilePicture?: string
  }
}

export interface GetServicesParams {
  page?: number
  limit?: number
  status?: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  service_type?: string
  location?: string
  urgency?: 'low' | 'medium' | 'high'
  search?: string
}

export interface GetServicesResponse {
  serviceRequests: ServiceRequest[]
  serviceProviders?: ServiceProvider[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateServiceRequest {
  service_type: string
  title: string
  description: string
  location: {
    address: string
    city: string
    state: string
    zip_code: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  urgency: 'low' | 'medium' | 'high'
  budget_min: number
  budget_max: number
  preferred_date?: string
  images?: string[]
}

export interface UpdateServiceRequest {
  service_type?: string
  title?: string
  description?: string
  location?: {
    address: string
    city: string
    state: string
    zip_code: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  urgency?: 'low' | 'medium' | 'high'
  budget_min?: number
  budget_max?: number
  preferred_date?: string
  images?: string[]
}

export interface ServiceStats {
  totalRequests: number
  openRequests: number
  assignedRequests: number
  inProgressRequests: number
  completedRequests: number
  cancelledRequests: number
  averageBudget: number
}

export const servicesService = {
  /**
   * Get all service requests with pagination and filtering
   */
  async getServices(params?: GetServicesParams): Promise<GetServicesResponse> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    const url = queryParams.toString() ? `/service-requests?${queryParams.toString()}` : '/service-requests'
    const response = await apiClient.get(url) as any
    return response.data.data
  },

  /**
   * Get service request by ID
   */
  async getServiceById(serviceId: string): Promise<ServiceRequest> {
    const response = await apiClient.get(`/service-requests/${serviceId}`) as any
    return response.data.data.serviceRequest
  },

  /**
   * Create a new service request
   */
  async createService(data: CreateServiceRequest): Promise<ServiceRequest> {
    const response = await apiClient.post('/service-requests', data) as any
    return response.data.data.serviceRequest
  },

  /**
   * Update service request
   */
  async updateService(serviceId: string, data: UpdateServiceRequest): Promise<ServiceRequest> {
    const response = await apiClient.put(`/service-requests/${serviceId}`, data) as any
    return response.data.data.serviceRequest
  },

  /**
   * Delete service request
   */
  async deleteService(serviceId: string): Promise<void> {
    await apiClient.delete(`/service-requests/${serviceId}`)
  },

  /**
   * Update service request status
   */
  async updateServiceStatus(
    serviceId: string,
    status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  ): Promise<ServiceRequest> {
    const response = await apiClient.patch(`/service-requests/${serviceId}/status`, {
      status: status
    }) as any
    return response.data.data.serviceRequest
  },

  /**
   * Get service request statistics
   */
  async getServiceStats(): Promise<ServiceStats> {
    const response = await apiClient.get('/service-requests/stats') as any
    return response.data.data
  },
}

