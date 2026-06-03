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

export type OrderCarrier =
  | 'manual'
  | 'delhivery'
  | 'bluedart'
  | 'dtdc'
  | 'indiapost'
  | 'shiprocket'
  | 'other'

export interface OrderStatusHistoryEntry {
  status: OrderStatus
  at: string
  byUserId?: string
  note?: string
}

export interface UpdateOrderRequest {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  trackingNumber?: string
  carrier?: OrderCarrier
  trackingUrl?: string
  deliveryNotes?: string
  notes?: string
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus
  notes?: string
  notifyCustomer?: boolean
}

export interface BulkShipOrderItem {
  orderId: string
  trackingNumber?: string
  carrier?: OrderCarrier
  trackingUrl?: string
}

export interface BulkShipOrdersRequest {
  items: BulkShipOrderItem[]
  notifyCustomer?: boolean
}

export interface BulkShipOrdersResponse {
  updated: string[]
  failed: Array<{ orderId: string; reason: string }>
}

export interface OrdersQuery {
  page?: number
  limit?: number
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  userId?: string
  providerId?: string
  orderNumber?: string
  /** Server-side: order #, customer email/name/phone, order id, user id */
  search?: string
  startDate?: string
  endDate?: string
  /** Orders awaiting ship or in transit (processing + shipped) */
  fulfillmentQueue?: boolean
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
  carrier?: OrderCarrier
  trackingUrl?: string
  deliveryNotes?: string
  statusHistory?: OrderStatusHistoryEntry[]
  shippedAt?: string
  deliveredAt?: string
  estimatedDeliveryAt?: string
  checkoutBatchId?: string | null
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
    category?: string
    subcategory?: string
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
      if (value === undefined || value === null) return
      if (key === 'fulfillmentQueue') {
        if (value === true) params.append('fulfillmentQueue', 'true')
        return
      }
      params.append(key, value.toString())
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

  static async bulkShipOrders(data: BulkShipOrdersRequest): Promise<ApiResponse<BulkShipOrdersResponse>> {
    return api.post<BulkShipOrdersResponse>('/orders/bulk-ship', data, {
      loadingMessage: 'Shipping orders…',
      showSuccessToast: false,
      showErrorToast: false,
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

  /** Admin: cancel any customer order (before shipped). Restores catalog stock. */
  static async cancelOrderAsAdmin(id: string, reason?: string): Promise<ApiResponse<Order>> {
    return api.put<Order>(`/orders/admin/cancel/${id}`, { reason }, {
      loadingMessage: 'Cancelling order…',
      showSuccessToast: false,
      showErrorToast: false,
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

