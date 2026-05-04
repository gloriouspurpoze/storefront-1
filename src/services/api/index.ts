// Export all services
export { api } from './base'
export { AuthService } from './auth.service'
export { ProductsService } from './products.service'
export { CategoriesService } from './categories.service'
export { SubcategoriesService } from './subcategories.service'
export { ServiceRequestsService } from './service-requests.service'
export { usersService } from './users.service'
export { servicesService } from './services.service'
export { platformServicesService } from './platformServices.service'
export { SlidersService } from './sliders.service'
export { ProvidersService } from './providers.service'
export { QuotesService } from './quotes.service'
export { BookingsService } from './bookings.service'
export { ProfessionalApplicationsService } from './professionalApplications.service'
export { OrdersService } from './orders.service'
export { ChatService } from './chat.service'
export { CMSService } from './cms.service'
export { ReviewsService } from './reviews.service'
export { BlogService } from './blog.service'
export { CouponsService } from './coupons.service'
export { OffersService } from './offers.service'
export { PaymentsService } from './payments.service'
export { AnalyticsService } from './analytics.service'
export { SearchService } from './search.service'
export { dashboardService } from './dashboard.service'
export { crmService, isCrmApiMode } from './crm.service'
export { crmApi } from './crm.api'
export { teamWorkApi } from './teamWork.api'
export { FinanceService } from './finance.service'
export { BazaarMarketplaceService } from './bazaarMarketplace.service'
export { ErrorHandler } from './error-handler'

// Export types from base
export type { RequestConfig, ApiResponse, ApiError } from './base'

// Export auth types
export type { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest 
} from './auth.service'

// Export product types
export type { 
  BulkDeleteRequest 
} from './products.service'

// Export all types from types directory
export * from '../../types'
