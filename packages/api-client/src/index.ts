export { createApiClient } from './createClient'
export { createServices } from './createServices'
export { isAuthCredentialFailure401, normalizeApiError } from './errors'
export { createAuthService } from './services/auth.service'
export { createBookingsService } from './services/bookings.service'
export { createDashboardService } from './services/dashboard.service'
export { createChatService, normalizeConversationList, normalizeMessageList } from './services/chat.service'
export { createNotificationsService } from './services/notifications.service'
export { createProfessionalsService } from './services/professionals.service'
export { createSupportService } from './services/support.service'
export { createProfessionalApplicationsService } from './services/professionalApplications.service'
export { createDisputeCasesService } from './services/disputeCases.service'
export { createAnalyticsService } from './services/analytics.service'
export { createCatalogService } from './services/catalog.service'
export { createCategoriesService } from './services/categories.service'
export { createCrmService } from './services/crm.service'
export { createEarningsService } from './services/earnings.service'
export { createInvoicesService } from './services/invoices.service'
export { createOrdersService } from './services/orders.service'
export { createPaymentsService } from './services/payments.service'
export { createPosService } from './services/pos.service'
export { createProductsService } from './services/products.service'
export { createRefundsService } from './services/refunds.service'
export { createServiceRequestsService } from './services/serviceRequests.service'
export { createUsersService } from './services/users.service'
export type {
  ApiClient,
  ApiError,
  ApiErrorCode,
  ApiResponse,
  CreateApiClientOptions,
  RequestConfig,
} from './types'
export type { ProfixerServices } from './createServices'
export type { AdminDashboardData, DashboardStats, RecentOrder } from './services/dashboard.service'
export type { ChatConversation, ChatMessage } from './services/chat.service'
export type { PushNotification } from './services/notifications.service'
export type { ProfessionalApplication, ProfessionalApplicationStatus } from './services/professionalApplications.service'
export type { DisputeCaseRow, DisputeCasesListResponse, DisputeCaseStatus } from './services/disputeCases.service'
export type { SupportTicketRow, SupportTicketsListResponse, ListTicketsParams } from './services/support.service'
export type { DashboardAnalytics } from './services/analytics.service'
export type {
  CatalogService,
  CreatePlatformServicePayload,
  CreatedCatalogService,
  ServiceType,
  ServiceStatus,
  ServiceListItem,
  ServiceListResult,
  ServiceListQuery,
  ServiceDetail,
  UpdatePlatformServicePayload,
} from './services/catalog.service'
export type {
  AdminCategory,
  CategoryType,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  ListCategoriesQuery,
} from './services/categories.service'
export type {
  ProductVendor,
  ProductImageEmbed,
  CreateProductPayload,
  CreatedProduct,
  ProductListItem,
  ProductListResult,
  ProductListQuery,
  ProductDetail,
  UpdateProductPayload,
} from './services/products.service'
export type { CrmContact, CrmMetrics, CreateCrmContactPayload } from './services/crm.service'
export type { AdminPayout, PlatformEarningsSummary } from './services/earnings.service'
export type { AdminCreateBookingPayload } from './services/pos.service'
export type { ServiceRequestRow, ServiceRequestsListResponse, ServiceRequestsQuery } from './services/serviceRequests.service'
export type {
  InvoiceRow,
  InvoiceLineItem,
  InvoiceStatus,
  InvoicePaymentStatus,
  InvoicesListResponse,
  InvoicesQuery,
} from './services/invoices.service'
export type {
  PaymentRow,
  PaymentStatus,
  PaymentsListResponse,
  PaymentsQuery,
} from './services/payments.service'
export type {
  RefundTicketRow,
  RefundRequestEmbed,
  RefundQueueResponse,
  RefundStatus,
} from './services/refunds.service'
export type {
  OrderRow,
  OrderItem,
  OrderAddress,
  OrderStatus,
  OrderPaymentStatus,
  OrdersListResponse,
  OrdersQuery,
} from './services/orders.service'
export type {
  CreateCustomerInput,
  CreateCustomerResult,
  UsersListResponse,
  UsersQuery,
  UserStats,
} from './services/users.service'
export { generateCustomerPassword, normalizeCustomerPhone } from './services/users.service'
export type {
  AuthService,
  LoginRequest,
  LoginResponse,
} from './services/auth.service'
