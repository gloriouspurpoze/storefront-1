import type { PaginationResponse } from './pagination.types'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'scheduled'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface Booking {
  id: string
  serviceRequestId?: string
  customerId?: string
  providerId?: string
  scheduledDate?: string
  scheduledTime?: string
  duration?: number
  totalAmount?: number
  status: BookingStatus
  paymentStatus?: string
  notes?: string
  bookingNumber?: string
  customerName?: string
  customerPhone?: string
  serviceName?: string
  category?: string
  completedDate?: string
  _id?: string
  address?: { area?: string; city?: string; phone?: string }
  city?: string
  estimatedCost?: number
  provider?: {
    businessName?: string
    rating?: number
    user?: { firstName?: string; lastName?: string; phone?: string }
  }
  customer?: { firstName?: string; lastName?: string; phone?: string }
  source?: 'web' | 'mobile_app'
  createdAt: string
  updatedAt?: string
  professionalId?: string
  professional?: {
    _id?: string
    firstName?: string
    lastName?: string
    email?: string
    professionalId?: string
  }
  cancellationReason?: string | null
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus
  notes?: string
}

export interface BookingsResponse {
  bookings: Booking[]
  pagination: PaginationResponse
}

export interface BookingsQuery {
  page?: number
  limit?: number
  status?: string
  customerId?: string
  providerId?: string
  professionalId?: string
  professional_id?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  source?: 'web' | 'mobile_app'
}
