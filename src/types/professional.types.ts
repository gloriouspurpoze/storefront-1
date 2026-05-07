/**
 * ============================================================================
 * PROFESSIONAL TYPES - FRONTEND
 * ============================================================================
 * Type definitions for Professional management in admin panel
 * 
 * @author CTO Team
 * @date November 7, 2025
 */

/** Account moderation (admin). Backend may return snake_case — normalize in UI when needed. */
export type ProfessionalAccountStatus = 'active' | 'suspended' | 'blocked'

/** One interval within a weekday (matches fixerprovider / Mongo `weeklyAvailability`) */
export type ProfessionalCalendarSlot = { start: string; end: string }

export type ProfessionalWeekdayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type ProfessionalWeeklyAvailability = Record<ProfessionalWeekdayKey, ProfessionalCalendarSlot[]>

/** KYC files uploaded from fixerprovider (`Professional.documents`) — same payload PUT /professionals/profile */
export interface ProfessionalVerificationDocument {
  _id?: string
  type: string
  documentUrl: string
  documentNumber?: string
  isVerified?: boolean
  verifiedAt?: string
}

export interface Professional {
  _id: string
  id: string
  professionalId: string
  /** Linked auth user for login disable / user admin flows when API provides it */
  userId?: string

  // Personal Information
  firstName: string
  lastName: string
  displayName?: string
  email: string
  phoneNumber: string
  alternatePhone?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  profileImage?: string
  
  // Professional Details
  serviceProviderId?: {
    _id: string
    businessName: string
    rating?: number
  }
  isIndependent: boolean
  
  // Services & Skills
  services: Array<{
    _id: string
    name: string
    description?: string
    icon?: string
  }>
  primaryService?: string
  categories: string[]
  skills: string[]
  certifications: Array<{
    name: string
    issuedBy: string
    issuedDate?: string
    expiryDate?: string
    certificateUrl?: string
    verificationStatus?: 'pending' | 'approved' | 'rejected'
    adminNotes?: string
  }>
  /** Identity / compliance uploads from the professional app (Mongo `documents`) */
  documents?: ProfessionalVerificationDocument[]
  experience: number
  expertiseLevel: 'beginner' | 'intermediate' | 'expert'
  
  // Location
  address: {
    street?: string
    area: string
    city: string
    state: string
    pincode: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  serviceAreas: Array<{
    city: string
    areas?: string[]
    pincodes?: string[]
    radius?: number
  }>
  
  // Work Schedule
  workingDays: string[]
  workingHours: {
    start: string
    end: string
  }
  availability: 'available' | 'busy' | 'offline'
  maxBookingsPerDay?: number
  /** Weekly calendar from provider app (`weeklyAvailability` in Mongo) */
  weeklyAvailability?: ProfessionalWeeklyAvailability
  
  // Status & Performance
  isActive: boolean
  /** When API supports moderation endpoints / expanded GET */
  accountStatus?: ProfessionalAccountStatus
  suspendedUntil?: string
  moderationReason?: string
  moderationNotes?: string
  lastModerationAt?: string
  isVerified: boolean
  verificationStatus: 'pending' | 'verified' | 'rejected'
  rating: number
  totalReviews: number
  completedJobs: number
  cancelledJobs: number
  
  // Additional Info
  bio?: string
  languages?: string[]
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CreateProfessionalData {
  /** Sent on admin create; backend creates User + links professionalId when present. */
  password?: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  alternatePhone?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  profileImage?: string
  
  serviceProviderId?: string
  isIndependent: boolean
  
  services: string[]
  primaryService?: string
  categories: string[]
  skills: string[]
  certifications?: Array<{
    name: string
    issuedBy: string
    issuedDate?: string
    expiryDate?: string
    certificateUrl?: string
    verificationStatus?: 'pending' | 'approved' | 'rejected'
    adminNotes?: string
  }>
  experience: number
  expertiseLevel: 'beginner' | 'intermediate' | 'expert'
  
  address: {
    street?: string
    area: string
    city: string
    state: string
    pincode: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  serviceAreas: Array<{
    city: string
    areas?: string[]
    pincodes?: string[]
    radius?: number
  }>
  
  workingDays: string[]
  workingHours: {
    start: string
    end: string
  }
  maxBookingsPerDay?: number
  
  bio?: string
  languages?: string[]
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }
}

export interface UpdateProfessionalData extends Partial<CreateProfessionalData> {
  availability?: 'available' | 'busy' | 'offline'
  isActive?: boolean
  isVerified?: boolean
  accountStatus?: ProfessionalAccountStatus
  moderationReason?: string
  moderationNotes?: string
  suspendedUntil?: string | null
  documents?: ProfessionalVerificationDocument[]
}

export interface ProfessionalsQuery {
  page?: number
  limit?: number
  search?: string
  serviceProviderId?: string
  service?: string
  category?: string
  city?: string
  availability?: 'available' | 'busy' | 'offline'
  expertiseLevel?: 'beginner' | 'intermediate' | 'expert'
  isVerified?: boolean
  /** Refine list when API supports it (e.g. rejected vs pending). */
  verificationStatus?: 'pending' | 'verified' | 'rejected'
  /** When API supports filtering by active flag */
  isActive?: boolean
  isIndependent?: boolean
  sortBy?: 'name' | 'rating' | 'experience' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface ProfessionalsResponse {
  professionals: Professional[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ProfessionalStats {
  totalProfessionals: number
  verifiedProfessionals: number
  availableProfessionals: number
  independentProfessionals: number
  averageRating: number
  averageExperience: number
  topSkills: Array<{
    skill: string
    count: number
  }>
  professionalsByCategory: Array<{
    category: string
    count: number
  }>
  /** Optional fleet moderation counts when GET /professionals/stats returns them */
  suspendedProfessionals?: number
  blockedProfessionals?: number
  inactiveProfessionals?: number
}

export interface UpdateVerificationData {
  isVerified: boolean
  verificationNotes?: string
  verifiedBy?: string
  /** When supported by the API, persists pending / verified / rejected. */
  verificationStatus?: 'pending' | 'verified' | 'rejected'
}

export interface UpdateAvailabilityData {
  availability: 'available' | 'busy' | 'offline'
  reason?: string
}

export interface SuspendProfessionalRequest {
  reason: string
  until?: string
}

export interface BlockProfessionalRequest {
  reason: string
}

