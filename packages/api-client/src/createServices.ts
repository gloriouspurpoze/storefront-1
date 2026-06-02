import type { ApiClient } from './types'
import { createAnalyticsService } from './services/analytics.service'
import { createAuthService } from './services/auth.service'
import { createBookingsService } from './services/bookings.service'
import { createCatalogService } from './services/catalog.service'
import { createChatService } from './services/chat.service'
import { createCrmService } from './services/crm.service'
import { createDashboardService } from './services/dashboard.service'
import { createDisputeCasesService } from './services/disputeCases.service'
import { createEarningsService } from './services/earnings.service'
import { createInvoicesService } from './services/invoices.service'
import { createNotificationsService } from './services/notifications.service'
import { createOrdersService } from './services/orders.service'
import { createPaymentsService } from './services/payments.service'
import { createPosService } from './services/pos.service'
import { createProfessionalApplicationsService } from './services/professionalApplications.service'
import { createProfessionalsService } from './services/professionals.service'
import { createRefundsService } from './services/refunds.service'
import { createServiceRequestsService } from './services/serviceRequests.service'
import { createSupportService } from './services/support.service'
import { createUsersService } from './services/users.service'

export function createServices(api: ApiClient) {
  return {
    auth: createAuthService(api),
    analytics: createAnalyticsService(api),
    bookings: createBookingsService(api),
    catalog: createCatalogService(api),
    crm: createCrmService(api),
    dashboard: createDashboardService(api),
    earnings: createEarningsService(api),
    chat: createChatService(api),
    invoices: createInvoicesService(api),
    notifications: createNotificationsService(api),
    orders: createOrdersService(api),
    payments: createPaymentsService(api),
    pos: createPosService(api),
    professionals: createProfessionalsService(api),
    refunds: createRefundsService(api),
    serviceRequests: createServiceRequestsService(api),
    support: createSupportService(api),
    applications: createProfessionalApplicationsService(api),
    disputes: createDisputeCasesService(api),
    users: createUsersService(api),
  }
}

export type ProfixerServices = ReturnType<typeof createServices>
