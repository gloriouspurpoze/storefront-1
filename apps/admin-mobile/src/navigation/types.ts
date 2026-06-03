export type AuthStackParamList = {
  Login: undefined
  Unauthorized: undefined
}

export type HomeStackParamList = {
  Dashboard: undefined
  Analytics: undefined
  BookingDetail: { id: string }
}

export type OpsStackParamList = {
  OpsHub: undefined
  BookingsList: undefined
  BookingDetail: { id: string }
  CreateBookingWizard: undefined
  ProfessionalsList: undefined
  ProfessionalDetail: { id: string }
  LiveMap: undefined
  ProviderApplications: undefined
  DisputeCases: undefined
  ServiceRequestsList: undefined
  ServiceRequestDetail: { id: string }
}

export type ChatStackParamList = {
  ChatInbox: undefined
  ChatThread: { threadId: string }
}

export type InboxStackParamList = {
  ApprovalsInbox: undefined
  Notifications: undefined
  SupportTickets: undefined
  RefundRequests: undefined
  RefundDetail: { ticketId: string }
}

export type MoreStackParamList = {
  MoreHub: undefined
  Settings: undefined
  CatalogHub: undefined
  ServicesList: undefined
  ProductsList: undefined
  CategoriesList: undefined
  CreateService: { id?: string } | undefined
  CreateCategory: { id?: string } | undefined
  CreateProduct: { id?: string } | undefined
  CrmHub: undefined
  CrmContactForm: undefined
  EarningsOverview: undefined
  InvoicesList: undefined
  InvoiceDetail: { id: string }
  PaymentsList: undefined
  PaymentDetail: { id: string }
  UsersList: undefined
  UserDetail: { id: string }
  OrdersList: undefined
  OrderDetail: { id: string }
}

export type AdminTabParamList = {
  HomeTab: undefined
  OpsTab: undefined
  ChatTab: undefined
  InboxTab: undefined
  MoreTab: undefined
}

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
}
