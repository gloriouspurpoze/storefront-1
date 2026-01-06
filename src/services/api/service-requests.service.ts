import { api } from './base'
import type {
  ServiceRequest,
  CreateServiceRequestRequest,
  UpdateServiceRequestRequest,
  ServiceRequestsResponse,
  ServiceRequestsQuery,
} from '../../types'

/**
 * Service Requests Service
 * Handles all service request-related API calls
 */
export class ServiceRequestsService {
  /**
   * Get service requests with pagination and filters
   */
  static async getServiceRequests(query: ServiceRequestsQuery = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/service-requests${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<ServiceRequestsResponse>(endpoint, {
      loadingMessage: 'Loading service requests...',
      showSuccessToast: false,
    })
  }

  /**
   * Get single service request by ID
   */
  static async getServiceRequest(id: string) {
    return api.get<ServiceRequest>(`/service-requests/${id}`, {
      loadingMessage: 'Loading service request...',
      showSuccessToast: false,
    })
  }

  /**
   * Create new service request
   */
  static async createServiceRequest(serviceRequest: CreateServiceRequestRequest) {
    return api.post<ServiceRequest>('/service-requests', serviceRequest, {
      loadingMessage: 'Creating service request...',
      successMessage: 'Service request created successfully!',
      errorMessage: 'Failed to create service request.',
    })
  }

  /**
   * Update existing service request
   */
  static async updateServiceRequest(id: string, serviceRequest: UpdateServiceRequestRequest) {
    return api.put<ServiceRequest>(`/service-requests/${id}`, serviceRequest, {
      loadingMessage: 'Updating service request...',
      successMessage: 'Service request updated successfully!',
      errorMessage: 'Failed to update service request.',
    })
  }

  /**
   * Delete service request
   */
  static async deleteServiceRequest(id: string) {
    return api.delete(`/service-requests/${id}`, {
      loadingMessage: 'Deleting service request...',
      successMessage: 'Service request deleted successfully!',
      errorMessage: 'Failed to delete service request.',
    })
  }

  /**
   * Get service requests by status
   */
  static async getServiceRequestsByStatus(status: string, query: Omit<ServiceRequestsQuery, 'status'> = {}) {
    return this.getServiceRequests({
      ...query,
      status,
    })
  }

  /**
   * Get service requests by service type
   */
  static async getServiceRequestsByType(serviceType: string, query: Omit<ServiceRequestsQuery, 'serviceType'> = {}) {
    return this.getServiceRequests({
      ...query,
      serviceType,
    })
  }

  /**
   * Get service requests by customer
   */
  static async getServiceRequestsByCustomer(customerId: string, query: Omit<ServiceRequestsQuery, 'customerId'> = {}) {
    return this.getServiceRequests({
      ...query,
      customerId,
    })
  }

  /**
   * Update service request status
   */
  static async updateServiceRequestStatus(id: string, status: string) {
    return api.patch<ServiceRequest>(`/service-requests/${id}/status`, { status }, {
      loadingMessage: 'Updating status...',
      successMessage: 'Status updated successfully!',
      errorMessage: 'Failed to update status.',
    })
  }

  /**
   * Assign provider to service request
   */
  static async assignProvider(id: string, providerId: string) {
    return api.patch<ServiceRequest>(`/service-requests/${id}/assign`, { providerId }, {
      loadingMessage: 'Assigning provider...',
      successMessage: 'Provider assigned successfully!',
      errorMessage: 'Failed to assign provider.',
    })
  }

  /**
   * Get service request statistics
   */
  static async getServiceRequestStats() {
    return api.get<{
      total: number
      byStatus: Record<string, number>
      byServiceType: Record<string, number>
      byUrgency: Record<string, number>
    }>('/service-requests/stats', {
      loadingMessage: 'Loading statistics...',
      showSuccessToast: false,
    })
  }
}
