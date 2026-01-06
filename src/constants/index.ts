/**
 * Application Constants
 * Centralized constants for the application
 */

// Time ranges for analytics and filters
export const TIME_RANGES = {
  LAST_7_DAYS: '7d',
  LAST_30_DAYS: '30d',
  LAST_3_MONTHS: '3m',
  LAST_6_MONTHS: '6m',
  LAST_YEAR: '1y',
} as const

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  DEFAULT_ROWS_PER_PAGE: 10,
} as const

// Status options
export const STATUS_OPTIONS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

// User types
export const USER_TYPES = {
  ADMIN: 'admin',
  PROVIDER: 'provider',
  PROFESSIONAL: 'professional',
  CUSTOMER: 'customer',
} as const

// Service types
export const SERVICE_TYPES = {
  FIXED: 'fixed',
  HOURLY: 'hourly',
  CONSULTATION: 'consultation',
} as const

// Working days
export const WORKING_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

// Professional categories
export const PROFESSIONAL_CATEGORIES = [
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'ac_technician', label: 'AC Technician' },
  { value: 'appliance_repair', label: 'Appliance Repair' },
  { value: 'pest_control', label: 'Pest Control' },
] as const

// Expertise levels
export const EXPERTISE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
] as const

// API endpoints (if needed for reference)
export const API_ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  PROVIDERS: '/providers',
  PROFESSIONALS: '/professionals',
  SERVICES: '/services',
  BOOKINGS: '/bookings',
  CATEGORIES: '/categories',
  PRODUCTS: '/products',
  ORDERS: '/orders',
  PAYMENTS: '/payments',
} as const

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  FULL: 'MMMM dd, yyyy',
  SHORT: 'MM/dd/yyyy',
  TIME: 'hh:mm a',
} as const

