// Base types
export interface PaginationResponse {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface Location {
  address: string
  city: string
  state: string
  zipCode: string
  coordinates?: {
    lat: number
    lng: number
  }
}

/** SaaS / multi-tenant organization reference (from API or login). */
export interface TenantRef {
  id: string
  name?: string
  slug?: string
}

// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  userType: 'customer' | 'provider' | 'admin' | 'super_admin'
  permissions?: string[]
  isVerified: boolean
  profilePicture?: string
  createdAt: string
  updatedAt?: string
  /** Present when API returns org/tenant context for SaaS admins. */
  tenant?: TenantRef
}

// Service Provider types
export interface ServiceProvider {
  id: string
  user_id: string
  business_name?: string
  business_license?: string
  services_offered?: string[]
  service_areas?: string[]
  verification_status: 'pending' | 'verified' | 'rejected'
  rating: number
  total_reviews: number
  years_experience: number
  bio?: string
  created_at: string
  updated_at: string
  user?: User
}

export interface CreateProviderRequest {
  business_name: string
  business_license?: string
  services_offered: string[]
  service_areas: string[]
  years_experience?: number
  bio?: string
}

export interface UpdateProviderRequest {
  business_name?: string
  business_license?: string
  services_offered?: string[]
  service_areas?: string[]
  verification_status?: 'pending' | 'verified' | 'rejected'
  years_experience?: number
  bio?: string
}

export interface ServiceProvidersResponse {
  providers: ServiceProvider[]
  pagination: PaginationResponse
}

export interface ProvidersQuery {
  page?: number
  limit?: number
  search?: string
  status?: string
  experience?: string
}

// Slider/Banner types – industry placements for web + mobile
export type SliderPlacement =
  | 'home_page_hero'   // Home page main hero carousel
  | 'offers'          // Offers & promotions section
  | 'category'        // Category / listing page banners
  | 'mobile_app_home' // Mobile app home hero
  | 'announcement'    // Announcement / notice bar
  | 'promo'          // Inline promo blocks
  | 'seasonal'       // Seasonal / campaign banners

export const SLIDER_PLACEMENT_LABELS: Record<SliderPlacement, string> = {
  home_page_hero: 'Home Page Hero',
  offers: 'Offers & Promotions',
  category: 'Category Banner',
  mobile_app_home: 'Mobile App Home',
  announcement: 'Announcement Bar',
  promo: 'Inline Promo',
  seasonal: 'Seasonal / Campaign',
}

export interface Slider {
  id: string
  title: string
  subtitle?: string
  description?: string
  image_url: string
  image_url_mobile?: string
  image_alt?: string
  button_text?: string
  button_url?: string
  position: number
  is_active: boolean
  placement?: SliderPlacement
  category_id?: string
  category_slug?: string
  category_name?: string
  start_date?: string
  end_date?: string
  target_audience?: 'all' | 'customers' | 'providers'
  created_at: string
  updated_at: string
}

export interface CreateSliderRequest {
  title: string
  subtitle?: string
  description?: string
  image_url: string
  image_url_mobile?: string
  image_alt?: string
  button_text?: string
  button_url?: string
  position: number
  is_active: boolean
  placement?: SliderPlacement
  category_id?: string
  category_slug?: string
  start_date?: string
  end_date?: string
  target_audience?: 'all' | 'customers' | 'providers'
}

export interface UpdateSliderRequest {
  title?: string
  subtitle?: string
  description?: string
  image_url?: string
  image_url_mobile?: string
  image_alt?: string
  button_text?: string
  button_url?: string
  position?: number
  is_active?: boolean
  placement?: SliderPlacement
  category_id?: string
  category_slug?: string
  start_date?: string
  end_date?: string
  target_audience?: 'all' | 'customers' | 'providers'
}

export interface SlidersResponse {
  sliders: Slider[]
  pagination: PaginationResponse
}

export interface SlidersQuery {
  page?: number
  limit?: number
  search?: string
  status?: string
  position?: string
  placement?: SliderPlacement | string
  audience?: string
  category_id?: string
}

// Service Request types
export interface ServiceRequest {
  id: string
  title: string
  description: string
  serviceType: string
  status: 'open' | 'quoted' | 'booked' | 'in_progress' | 'completed' | 'cancelled'
  quotesCount?: number
  urgency: 'low' | 'medium' | 'high'
  budgetMin?: number
  budgetMax?: number
  preferredDate?: string
  preferredTime?: string
  location: Location
  customerId: string
  providerId?: string
  quotes?: Quote[]
  createdAt: string
  updatedAt?: string
}

export interface CreateServiceRequestRequest {
  title: string
  description: string
  serviceType: string
  urgency: 'low' | 'medium' | 'high'
  budgetMin?: number
  budgetMax?: number
  preferredDate?: string
  preferredTime?: string
  location: Location
}

export interface UpdateServiceRequestRequest {
  title?: string
  description?: string
  urgency?: 'low' | 'medium' | 'high'
  budgetMin?: number
  budgetMax?: number
  preferredDate?: string
  preferredTime?: string
}

export interface ServiceRequestsResponse {
  serviceRequests: ServiceRequest[]
  pagination: PaginationResponse
}

export interface ServiceRequestsQuery {
  page?: number
  limit?: number
  status?: string
  serviceType?: string
  customerId?: string
  urgency?: string
}

// Provider types
export interface Provider {
  id: string
  businessName: string
  businessLicense?: string
  servicesOffered: string[]
  serviceAreas: string[]
  verificationStatus: 'pending' | 'verified' | 'rejected'
  rating: number
  totalReviews: number
  yearsExperience: number
  bio?: string
  user: User
  reviews?: Review[]
  createdAt: string
  updatedAt?: string
}

export interface CreateProviderRequest {
  businessName: string
  businessLicense?: string
  servicesOffered: string[]
  serviceAreas: string[]
  yearsExperience: number
  bio?: string
}

export interface UpdateProviderRequest {
  businessName?: string
  businessLicense?: string
  servicesOffered?: string[]
  serviceAreas?: string[]
  yearsExperience?: number
  bio?: string
}

export interface ProvidersResponse {
  providers: Provider[]
  pagination: PaginationResponse
}

export interface ProvidersQuery {
  page?: number
  limit?: number
  serviceType?: string
  verificationStatus?: string
  minRating?: number
  location?: string
}

export interface Review {
  id: string
  rating: number
  comment: string
  customer: {
    firstName: string
    lastName: string
  }
  createdAt: string
}

// Quote types
export interface Quote {
  id: string
  serviceRequestId: string
  providerId: string
  amount: number
  description: string
  estimatedDuration?: number
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  validUntil?: string
  notes?: string
  provider: {
    businessName: string
    rating: number
  }
  createdAt: string
  updatedAt?: string
}

export interface CreateQuoteRequest {
  serviceRequestId: string
  amount: number
  description: string
  estimatedDuration?: number
  validUntil?: string
}

export interface QuotesResponse {
  quotes: Quote[]
  pagination: PaginationResponse
}

export interface QuotesQuery {
  page?: number
  limit?: number
  status?: string
  serviceRequestId?: string
  providerId?: string
}

// Booking types
export interface Booking {
  id: string
  serviceRequestId: string
  customerId: string
  providerId: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  totalAmount: number
  status: 'pending' | 'confirmed' | 'scheduled' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded' | 'paid' | 'customer_paid' | 'verified' | 'settled_to_professional'
  notes?: string
  bookingNumber?: string
  customerName?: string
  customerPhone?: string
  serviceName?: string
  category?: string
  serviceRequest?: {
    title: string
    serviceType: string
    location: Location
  }
  completedDate?: string
  _id?: string
  services?: Array<{
    serviceName: string
    serviceDetails: {
      name: string
    }
  }>
  address?: {
    area: string
    city: string
    phone: string
  }
  city?: string
  estimatedCost?: number
  provider: {
    businessName: string
    rating: number
    user: {
      firstName: string
      lastName: string
      phone: string
    }
  }
  customer: {
    firstName: string
    lastName: string
    phone: string
  }
  /** Where the booking was created: 'web' (website) or 'mobile_app' */
  source?: 'web' | 'mobile_app';
  createdAt: string
  updatedAt?: string
}

export interface UpdateBookingStatusRequest {
  status: 'pending' | 'confirmed' | 'scheduled' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
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
  /** Filter by where booking was created: 'web' | 'mobile_app' */
  source?: 'web' | 'mobile_app'
}

// Payment types
export interface Payment {
  id: string
  bookingId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: string
  transactionId?: string
  customerName?: string
  customerEmail?: string
  providerName?: string
  providerEmail?: string
  serviceName?: string
  category?: string
  platformFee?: number
  fee?: number
  providerAmount?: number
  netAmount?: number
  payoutDate?: string
  completedAt?: string
  customer?: {
    name: string
    email: string
  }
  provider?: {
    name: string
    email: string
  }
  service?: string
  createdAt: string
  updatedAt?: string
}

export interface CreatePaymentIntentRequest {
  bookingId: string
  amount: number
  currency: string
  paymentMethod: string
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string
  bookingId: string
}

export interface PaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
}

// Order types
export interface Order {
  id: string
  order_id: string
  customer: {
    id: string
    name: string
    email: string
    avatar: string
    type: 'Pro Customer' | 'Regular Customer' | 'VIP Customer'
  }
  product: {
    id: string
    name: string
    image: string
    type: string
  }
  amount: number
  payment_method: string
  status: 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled'
  order_date: string
  created_at: string
  updated_at: string
}

export interface OrderStats {
  total_orders: number
  new_orders: number
  completed_orders: number
  cancelled_orders: number
  total_revenue: number
  average_order_value: number
  period: string
}

export type OrderStatus = 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled'

// Product types (existing but enhanced)
export interface Product {
  id: string | number
  provider_id?: string
  category_id?: string | number
  name: string
  description: string
  short_description?: string
  sku: string
  price: number
  original_price?: number
  compare_price?: number
  cost?: number
  stock_quantity: number
  low_stock_threshold?: number
  stockQuantity?: number // For backward compatibility
  status?: 'active' | 'inactive' | 'discontinued'
  is_active?: boolean
  is_featured?: boolean
  isFeatured?: boolean // For backward compatibility
  is_new?: boolean
  free_shipping?: boolean
  weight?: number | string
  dimensions?: {
    length: number
    width: number
    height: number
    unit?: string
  }
  images: string[]
  specifications?: Record<string, any>
  features?: string[]
  tags?: string[]
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  rating?: number
  average_rating?: number
  review_count?: number
  view_count?: number
  sales_count?: number
  category?: {
    id: string
    name: string
  }
  provider?: {
    businessName: string
  }
  created_at?: string
  updated_at?: string
  createdAt?: string // For backward compatibility
  updatedAt?: string // For backward compatibility
}

export interface CreateProductRequest {
  category_id: string
  name: string
  description: string
  short_description?: string
  price: number
  original_price?: number
  sku: string
  stock_quantity: number
  images?: string[]
  specifications?: { [key: string]: any }
  is_active?: boolean
  is_featured?: boolean
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  tags?: string[]
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  short_description?: string
  price?: number
  original_price?: number
  sku?: string
  stock_quantity?: number
  /** Alert when on-hand quantity is at or below this level (inventory ops). */
  low_stock_threshold?: number
  images?: string[]
  specifications?: { [key: string]: any }
  is_active?: boolean
  is_featured?: boolean
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  tags?: string[]
}

export interface ProductsResponse {
  products: Product[]
  pagination: PaginationResponse
}

export interface ProductsQuery {
  page?: number
  limit?: number
  category_id?: string
  provider_id?: string
  is_active?: boolean
  is_featured?: boolean
  min_price?: number
  max_price?: number
  search?: string
  tags?: string[]
  sort_by?: 'name' | 'price' | 'created_at' | 'rating'
  sort_order?: 'asc' | 'desc'
}

// Enhanced Category types matching backend model
export interface Category {
  id: string
  name: string
  slug: string
  description: string
  parentId?: string
  parent_id?: string // Legacy field for backward compatibility
  status: 'active' | 'inactive'
  isActive: boolean // MongoDB field
  categoryType?: 'product' | 'service' | 'both'
  type: 'product' | 'service' | 'both' // Enhanced field
  subcategories?: Category[]
  createdAt: string
  updatedAt?: string
  created_at: string // Legacy field
  updated_at?: string // Legacy field
  image?: string
  icon?: string
  sortOrder?: number
  sort_order?: number // Legacy field
  
  // Enhanced hierarchy fields
  level: number
  path: string
  breadcrumbs: string[]
  isLeaf: boolean
  childrenCount: number
  totalChildrenCount: number
  
  // SEO and marketing fields
  metaTitle?: string
  metaDescription?: string
  seoKeywords?: string[]
  featuredImage?: string
  bannerImage?: string
  colorCode?: string
  
  // Analytics fields
  viewCount: number
  clickCount: number
  lastViewedAt?: string
  
  // Soft delete and audit
  isDeleted: boolean
  deletedAt?: string
  createdBy?: string
  updatedBy?: string
}

export interface CreateCategoryRequest {
  name: string
  description?: string
  parentId?: string
  parent_id?: string // Legacy field
  status?: 'active' | 'inactive'
  categoryType?: 'product' | 'service' | 'both'
  image?: string
  icon?: string
  sortOrder?: number
  
  // Enhanced fields
  metaTitle?: string
  metaDescription?: string
  seoKeywords?: string[]
  featuredImage?: string
  bannerImage?: string
  colorCode?: string
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  parentId?: string
  status?: 'active' | 'inactive'
  categoryType?: 'product' | 'service' | 'both'
  image?: string
  sortOrder?: number
}

export interface CategoriesQuery {
  page?: number
  limit?: number
  parentId?: string
  parent_id?: string // Legacy field
  status?: string
  is_active?: boolean // MongoDB field
  search?: string
  category_type?: 'product' | 'service' | 'both'
  level?: number
  sort_by?: 'name' | 'created_at' | 'product_count' | 'status' | 'viewCount' | 'clickCount'
  sort_order?: 'asc' | 'desc'
}

export interface CategoriesResponse {
  categories: Category[]
  pagination: PaginationResponse
}

export interface CategoryStats {
  totalCategories: number
  activeCategories: number
  inactiveCategories: number
  categoriesWithProducts: number
  topLevelCategories: number
  subcategories: number
}

export interface CategoryTreeItem extends Category {
  children?: CategoryTreeItem[]
  level: number
  hasChildren: boolean
  productCount?: number
}

export interface CategoryWithStats extends Category {
  productCount: number
  subcategoryCount: number
  isExpanded?: boolean
}

// Analytics types
export interface DashboardAnalytics {
  overview: {
    totalUsers: number
    totalProviders: number
    totalServiceRequests: number
    totalBookings: number
    totalRevenue: number
  }
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
  }>
  serviceStats: Array<{
    serviceType: string
    totalRequests: number
    completedRequests: number
    averageRating: number
  }>
}

// Search types
export interface SearchResult {
  type: 'user' | 'provider' | 'service' | 'product'
  id: string
  title: string
  description: string
  rating?: number
  metadata?: Record<string, any>
}

export interface SearchResponse {
  results: SearchResult[]
  pagination: PaginationResponse
}

export interface SearchQuery {
  q: string
  type?: 'users' | 'providers' | 'services' | 'products'
  page?: number
  limit?: number
}

// Common query interfaces
export interface BaseQuery {
  page?: number
  limit?: number
}

export interface SortOptions {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// File upload types
export interface FileUploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
}

// Menu Management types
export interface MenuItem {
  id?: string
  _id?: string
  label: string
  url?: string
  type: 'link' | 'page' | 'category' | 'custom' | 'divider'
  target?: '_self' | '_blank' | '_parent' | '_top'
  icon?: string
  cssClass?: string
  order: number
  isActive: boolean
  children?: MenuItem[]
  parentId?: string
  metadata?: {
    pageId?: string
    categoryId?: string
    customData?: Record<string, any>
  }
  createdAt?: string
  updatedAt?: string
}

export interface Menu {
  id?: string
  _id?: string
  name: string
  slug: string
  location: 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom'
  description?: string
  items: MenuItem[]
  isActive: boolean
  settings?: {
    maxDepth?: number
    showIcons?: boolean
    collapseOnMobile?: boolean
    cssClass?: string
  }
  createdAt: string
  updatedAt?: string
}

export interface CreateMenuRequest {
  name: string
  slug?: string
  location: 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom'
  description?: string
  items?: MenuItem[]
  isActive?: boolean
  settings?: {
    maxDepth?: number
    showIcons?: boolean
    collapseOnMobile?: boolean
    cssClass?: string
  }
}

export interface UpdateMenuRequest {
  name?: string
  slug?: string
  location?: 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom'
  description?: string
  items?: MenuItem[]
  isActive?: boolean
  settings?: {
    maxDepth?: number
    showIcons?: boolean
    collapseOnMobile?: boolean
    cssClass?: string
  }
}

export interface CreateMenuItemRequest {
  label: string
  url?: string
  type: 'link' | 'page' | 'category' | 'custom' | 'divider'
  target?: '_self' | '_blank' | '_parent' | '_top'
  icon?: string
  cssClass?: string
  order: number
  isActive?: boolean
  parentId?: string
  metadata?: {
    pageId?: string
    categoryId?: string
    customData?: Record<string, any>
  }
}

export interface UpdateMenuItemRequest {
  label?: string
  url?: string
  type?: 'link' | 'page' | 'category' | 'custom' | 'divider'
  target?: '_self' | '_blank' | '_parent' | '_top'
  icon?: string
  cssClass?: string
  order?: number
  isActive?: boolean
  parentId?: string
  metadata?: {
    pageId?: string
    categoryId?: string
    customData?: Record<string, any>
  }
}

export interface MenusResponse {
  menus: Menu[]
  pagination: PaginationResponse
}

export interface MenusQuery {
  page?: number
  limit?: number
  location?: 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom'
  isActive?: boolean
  search?: string
  sort_by?: 'name' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

// Static Data types
export interface StaticData {
  categories?: Category[]
  services?: any[]
  providers?: ServiceProvider[]
  [key: string]: any
}