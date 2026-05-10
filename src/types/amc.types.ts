export type AmcContractStatus =
  | 'draft'
  | 'active'
  | 'suspended'
  | 'expired'
  | 'cancelled'
  | 'renewed'

export type AmcPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

export type AmcVisitStatus = 'scheduled' | 'completed' | 'skipped' | 'no_show'

export interface AmcPropertyAddress {
  line1?: string
  line2?: string
  city?: string
  state?: string
  pincode?: string
  landmark?: string
}

export interface AmcVisit {
  _id: string
  scheduledFor?: string
  completedAt?: string
  status: AmcVisitStatus
  bookingId?: string
  professionalId?: string
  serviceSummary?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

/** B2C-safe payload from GET /amc/me/contracts — omits internal/admin-only fields */
export interface AmcVisitCustomer {
  _id?: string
  scheduledFor?: string
  completedAt?: string
  status: AmcVisitStatus
  bookingId?: string
  serviceSummary?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface AmcContractCustomerView {
  _id: string
  contractNumber: string
  customerId: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  status: AmcContractStatus
  planName: string
  planDescription?: string
  coveredCategories: string[]
  startDate: string
  endDate: string
  totalAmount: number
  amountPaid: number
  currency: string
  paymentStatus: AmcPaymentStatus
  visitsIncluded: number
  visitsUsed: number
  visits: AmcVisitCustomer[]
  propertyAddress?: AmcPropertyAddress
  customerNotes?: string
  createdAt?: string
  updatedAt?: string
}

export interface AmcContract {
  _id: string
  tenantId?: string
  contractNumber: string
  customerId: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  status: AmcContractStatus
  planName: string
  planDescription?: string
  coveredCategories: string[]
  startDate: string
  endDate: string
  totalAmount: number
  amountPaid: number
  currency: string
  paymentStatus: AmcPaymentStatus
  visitsIncluded: number
  visitsUsed: number
  visits: AmcVisit[]
  primaryProfessionalId?: string
  propertyAddress?: AmcPropertyAddress
  internalNotes?: string
  customerNotes?: string
  invoiceId?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface AmcSummary {
  byStatus: Record<string, number>
  expiringWithin30Days: number
  total: number
}

export interface AmcListResponse {
  contracts: AmcContract[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface AmcCustomerListResponse {
  contracts: AmcContractCustomerView[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

/** Marketed AMC plan (catalogue) — distinct from customer `AmcContract` */
export interface AmcPackage {
  _id: string
  tenantId?: string
  title: string
  slug: string
  summary: string
  description?: string
  coveredCategories: string[]
  visitsIncluded: number
  durationMonths: number
  priceFrom?: number
  currency: string
  sortOrder: number
  isPublished: boolean
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

export type AmcPackagePublic = Omit<AmcPackage, 'tenantId' | 'isPublished' | 'createdAt' | 'updatedAt'>

export interface AmcPackageListResponse {
  packages: AmcPackage[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}
