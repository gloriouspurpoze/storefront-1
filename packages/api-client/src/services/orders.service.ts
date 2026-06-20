import type { ApiClient } from '../types'
import type { PaginationResponse } from '@profixer/types'
import { unwrapApiData } from '../unwrap'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type OrderPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  price: number
  total: number
  product?: {
    name?: string
    images?: string[]
    category?: string
  }
}

export interface OrderAddress {
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

export interface OrderRow {
  id: string
  _id?: string
  userId?: string
  providerId?: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: OrderPaymentStatus
  paymentMethod?: string
  items?: OrderItem[]
  totalAmount: number
  shippingAmount?: number
  taxAmount?: number
  discountAmount?: number
  shippingAddress?: OrderAddress
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  estimatedDeliveryAt?: string
  notes?: string
  createdAt: string
  updatedAt?: string
  customer?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }
  provider?: {
    businessName?: string
  }
}

export interface OrdersQuery {
  page?: number
  limit?: number
  status?: OrderStatus
  paymentStatus?: OrderPaymentStatus
  userId?: string
  providerId?: string
  search?: string
  startDate?: string
  endDate?: string
  fulfillmentQueue?: boolean
  deliveredToday?: boolean
}

export interface OrdersListResponse {
  orders: OrderRow[]
  pagination: PaginationResponse
}

function defaultPagination(): PaginationResponse {
  return { page: 1, limit: 25, total: 0, totalPages: 0 }
}

function normalizeList(raw: unknown): OrdersListResponse {
  const data = unwrapApiData<unknown>(raw)
  if (Array.isArray(data)) {
    return {
      orders: data as OrderRow[],
      pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 },
    }
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    const orders = (Array.isArray(d.orders) ? d.orders : []) as OrderRow[]
    const pagination = (d.pagination as PaginationResponse | undefined) ?? {
      page: 1,
      limit: orders.length,
      total: orders.length,
      totalPages: 1,
    }
    return { orders, pagination }
  }
  return { orders: [], pagination: defaultPagination() }
}

export function createOrdersService(api: ApiClient) {
  return {
    async getOrders(query: OrdersQuery = {}): Promise<OrdersListResponse> {
      const res = await api.get<unknown>('/orders', {
        params: query as Record<string, unknown>,
      })
      return normalizeList(res.data ?? res)
    },
    async getOrder(id: string): Promise<OrderRow> {
      const res = await api.get<unknown>(`/orders/${id}`)
      return unwrapApiData<OrderRow>(res.data ?? res)
    },
    async updateStatus(
      id: string,
      payload: { status: OrderStatus; notes?: string },
    ): Promise<OrderRow> {
      const res = await api.patch<unknown>(`/orders/${id}/status`, payload)
      return unwrapApiData<OrderRow>(res.data ?? res)
    },
    async cancelOrder(id: string, reason?: string): Promise<OrderRow> {
      const res = await api.put<unknown>(`/orders/admin/cancel/${id}`, { reason })
      return unwrapApiData<OrderRow>(res.data ?? res)
    },
  }
}

export type OrdersService = ReturnType<typeof createOrdersService>
