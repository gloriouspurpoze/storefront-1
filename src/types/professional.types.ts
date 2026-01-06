/**
 * ============================================================================
 * PROFESSIONAL TYPES - FRONTEND
 * ============================================================================
 * Type definitions for Professional management in admin panel
 * 
 * @author CTO Team
 * @date November 7, 2025
 */

export interface Professional {
  _id: string
  id: string
  professionalId: string
  
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
  }>
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
  
  // Status & Performance
  isActive: boolean
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
}

export interface UpdateVerificationData {
  isVerified: boolean
  verificationNotes?: string
  verifiedBy?: string
}

export interface UpdateAvailabilityData {
  availability: 'available' | 'busy' | 'offline'
  reason?: string
}

