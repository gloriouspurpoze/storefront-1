/**
 * Orders Service
 * Handles all order-related API calls
 * 
 * @author Senior Engineering Team
 * @version 1.0.0
 */

import { api } from './base'
import type {
  ApiResponse,
} from './base'

// ==================== Request Types ====================

export interface CreateOrderRequest {
  providerId: string
  items: OrderItemInput[]
  shippingAddress: Address
  billingAddress?: Address
  couponCode?: string
  referralId?: string
  notes?: string
  paymentMethod?: string
}

export interface UpdateOrderRequest {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  trackingNumber?: string
  notes?: string
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus
  notes?: string
}

export interface OrdersQuery {
  page?: number
  limit?: number
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  userId?: string
  providerId?: string
  orderNumber?: string
  startDate?: string
  endDate?: string
}

export interface OrderItemInput {
  productId: string
  quantity: number
}

// ==================== Data Types ====================

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded'

export type PaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'refunded'

export interface Address {
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

export interface Order {
  id: string
  userId: string
  providerId: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod?: string
  paymentId?: string
  items: OrderItem[]
  totalAmount: number
  shippingAmount: number
  taxAmount: number
  discountAmount: number
  couponCode?: string
  shippingAddress: Address
  billingAddress?: Address
  notes?: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  createdAt: string
  updatedAt: string
  customer?: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  provider?: {
    businessName: string
  }
}

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  price: number
  total: number
  product?: {
    name: string
    images?: string[]
  }
}

export interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface OrderStatsResponse {
  totalOrders: number
  totalRevenue: number
  byStatus: Record<OrderStatus, number>
  byPaymentStatus: Record<PaymentStatus, number>
  averageOrderValue: number
  recentOrders: Order[]
}

/**
 * Orders Service
 * Handles all order-related API calls
 */
export class OrdersService {
  /**
   * Get orders with pagination and filters
   */
  static async getOrders(query: OrdersQuery = {}): Promise<ApiResponse<OrdersResponse>> {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/orders${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<OrdersResponse>(endpoint, {
      loadingMessage: 'Loading orders...',
      showSuccessToast: false,
    })
  }

  /**
   * Get single order by ID
   */
  static async getOrder(id: string): Promise<ApiResponse<Order>> {
    return api.get<Order>(`/orders/${id}`, {
      loadingMessage: 'Loading order...',
      showSuccessToast: false,
    })
  }

  /**
   * Get order by order number
   */
  static async getOrderByNumber(orderNumber: string): Promise<ApiResponse<Order>> {
    return api.get<Order>(`/orders/number/${orderNumber}`, {
      loadingMessage: 'Loading order...',
      showSuccessToast: false,
    })
  }

  /**
   * Create a new order
   */
  static async createOrder(data: CreateOrderRequest): Promise<ApiResponse<Order>> {
    return api.post<Order>('/orders', data, {
      loadingMessage: 'Creating order...',
      successMessage: 'Order created successfully!',
      errorMessage: 'Failed to create order.',
    })
  }

  /**
   * Update order
   */
  static async updateOrder(id: string, data: UpdateOrderRequest): Promise<ApiResponse<Order>> {
    return api.put<Order>(`/orders/${id}`, data, {
      loadingMessage: 'Updating order...',
      successMessage: 'Order updated successfully!',
      errorMessage: 'Failed to update order.',
    })
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(id: string, statusData: UpdateOrderStatusRequest): Promise<ApiResponse<Order>> {
    return api.patch<Order>(`/orders/${id}/status`, statusData, {
      loadingMessage: 'Updating order status...',
      successMessage: 'Order status updated successfully!',
      errorMessage: 'Failed to update order status.',
    })
  }

  /**
   * Cancel order
   */
  static async cancelOrder(id: string, reason?: string): Promise<ApiResponse<Order>> {
    return api.put<Order>(`/orders/${id}/cancel`, { reason }, {
      loadingMessage: 'Cancelling order...',
      successMessage: 'Order cancelled successfully!',
      errorMessage: 'Failed to cancel order.',
    })
  }

  /**
   * Get user's own orders
   */
  static async getMyOrders(query: Omit<OrdersQuery, 'userId'> = {}): Promise<ApiResponse<OrdersResponse>> {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/orders/my-orders${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<OrdersResponse>(endpoint, {
      loadingMessage: 'Loading your orders...',
      showSuccessToast: false,
    })
  }

  /**
   * Get provider's orders
   */
  static async getProviderOrders(query: Omit<OrdersQuery, 'providerId'> = {}): Promise<ApiResponse<OrdersResponse>> {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/orders/provider/my-orders${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<OrdersResponse>(endpoint, {
      loadingMessage: 'Loading orders...',
      showSuccessToast: false,
    })
  }

  /**
   * Get orders by status
   */
  static async getOrdersByStatus(status: OrderStatus, query: Omit<OrdersQuery, 'status'> = {}): Promise<ApiResponse<OrdersResponse>> {
    return this.getOrders({
      ...query,
      status,
    })
  }

  /**
   * Get pending orders
   */
  static async getPendingOrders(query: Omit<OrdersQuery, 'status'> = {}): Promise<ApiResponse<OrdersResponse>> {
    return this.getOrdersByStatus('pending', query)
  }

  /**
   * Get confirmed orders
   */
  static async getConfirmedOrders(query: Omit<OrdersQuery, 'status'> = {}): Promise<ApiResponse<OrdersResponse>> {
    return this.getOrdersByStatus('confirmed', query)
  }

  /**
   * Get processing orders
   */
  static async getProcessingOrders(query: Omit<OrdersQuery, 'status'> = {}): Promise<ApiResponse<OrdersResponse>> {
    return this.getOrdersByStatus('processing', query)
  }

  /**
   * Get shipped orders
   */
  static async getShippedOrders(query: Omit<OrdersQuery, 'status'> = {}): Promise<ApiResponse<OrdersResponse>> {
    return this.getOrdersByStatus('shipped', query)
  }

  /**
   * Get delivered orders
   */
  static async getDeliveredOrders(query: Omit<OrdersQuery, 'status'> = {}): Promise<ApiResponse<OrdersResponse>> {
    return this.getOrdersByStatus('delivered', query)
  }

  /**
   * Get cancelled orders
   */
  static async getCancelledOrders(query: Omit<OrdersQuery, 'status'> = {}): Promise<ApiResponse<OrdersResponse>> {
    return this.getOrdersByStatus('cancelled', query)
  }

  /**
   * Get order statistics
   */
  static async getOrderStats(providerId?: string): Promise<ApiResponse<OrderStatsResponse>> {
    const endpoint = providerId ? `/orders/stats?providerId=${providerId}` : '/orders/stats'
    
    return api.get<OrderStatsResponse>(endpoint, {
      loadingMessage: 'Loading order statistics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get orders for dashboard
   */
  static async getOrdersForDashboard(limit: number = 10): Promise<ApiResponse<{
    recentOrders: Order[]
    stats: {
      total: number
      pending: number
      processing: number
      shipped: number
      delivered: number
      cancelled: number
    }
  }>> {
    return api.get(`/orders/dashboard?limit=${limit}`, {
      loadingMessage: 'Loading dashboard data...',
      showSuccessToast: false,
    })
  }
}

