import type { PaginationResponse } from './pagination.types'

export interface Professional {
  _id: string
  id: string
  professionalId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  availability?: 'available' | 'busy' | 'offline'
  isVerified?: boolean
  profileImage?: string
  address?: {
    area?: string
    city?: string
    state?: string
    pincode?: string
    coordinates?: { latitude: number; longitude: number }
  }
}

export interface ProfessionalsQuery {
  page?: number
  limit?: number
  search?: string
  city?: string
  availability?: 'available' | 'busy' | 'offline'
  isVerified?: boolean
}

export interface ProfessionalsResponse {
  professionals: Professional[]
  pagination: PaginationResponse
}

export interface ProfessionalLiveLocationRow {
  id: string
  professionalId: string | null
  name: string
  phone: string
  availability: 'available' | 'busy' | 'offline'
  latitude: number | null
  longitude: number | null
  lastLocationAt: string | null
}
