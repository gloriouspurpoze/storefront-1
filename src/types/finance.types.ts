export type FinanceExpenseStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'void'

export type FinanceExpensePaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'upi' | 'cheque' | 'other'

export type FinanceCashAccountKind = 'bank' | 'cash' | 'wallet' | 'other'

export interface FinanceRef {
  id: string
  name?: string
  code?: string
  kind?: FinanceCashAccountKind
  currency?: string
  taxId?: string
}

export interface FinanceExpense {
  id: string
  title: string
  description?: string
  amount: number
  currency: string
  taxAmount: number
  expenseDate: string
  vendorInvoiceNumber?: string
  dueDate?: string
  submittedAt?: string
  attachments?: string[]
  categoryId?: string | FinanceRef
  vendorId?: string | FinanceRef
  cashAccountId?: string | FinanceRef
  status: FinanceExpenseStatus
  paymentMethod: string
  externalRef?: string
  tags: string[]
  billable: boolean
  crmCompanyId?: string
  bookingId?: string | FinanceRef
  invoiceId?: string | FinanceRef
  statementLineId?: string
  createdBy: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  paidAt?: string
  internalNote?: string
  createdAt?: string
  updatedAt?: string
}

export interface FinanceCashAccount {
  id: string
  name: string
  kind: FinanceCashAccountKind
  currency: string
  institution?: string
  accountMask?: string
  openingBalance: number
  notes?: string
  isActive: boolean
}

export interface FinanceVendor {
  id: string
  name: string
  legalName?: string
  email?: string
  phone?: string
  taxId?: string
  billingAddress?: string
  paymentTermsDays?: number
  notes?: string
  isActive: boolean
}

export interface FinanceVendorDetailResponse {
  vendor: FinanceVendor
  usage: { expenses: number; recurringTemplates: number }
}

export interface FinanceVendorMergeResult {
  merged: boolean
  fromVendorId: string
  toVendorId: string
  expensesReassigned: number
  recurringReassigned: number
}

export interface FinanceBulkImportResult {
  inserted: number
  skipped: number
  errors: string[]
  capped?: boolean
}

export interface FinanceExpenseCategory {
  id: string
  name: string
  code?: string
  description?: string
  parentCategoryId?: string
  glHint?: string
  isSystem?: boolean
  isActive: boolean
}

export interface FinanceCategoryDetailResponse {
  category: FinanceExpenseCategory
  usage: { expenses: number; recurringTemplates: number; budgetLines: number }
}

export interface FinanceCategoryMergeResult {
  merged: boolean
  fromCategoryId: string
  toCategoryId: string
  expensesReassigned: number
  recurringReassigned: number
  budgetLinesMerged: number
  budgetLinesMoved: number
}

export interface FinanceBudgetLine {
  id: string
  year: number
  month: number
  categoryId: string | FinanceRef
  amount: number
  currency: string
  notes?: string
}

export interface FinanceOverviewSeries {
  month: string
  revenue: number
  expenseCashBasis: number
  expenseAccrualBasis: number
  netCash: number
}

export interface FinanceOverview {
  series: FinanceOverviewSeries[]
  /** Present on current API; optional for older responses. */
  settings?: { lockedExpenseThrough: string | null }
  alerts: {
    pendingApprovals: number
    draftExpenses: number
    overduePayablesCount?: number
    overduePayablesAmount?: number
    unreconciledDebitLines?: number
  }
  mtd: {
    revenue: number
    expenseCashBasis: number
    expenseAccrualBasis: number
    netCash: number
  }
  basis: {
    revenue: string
    expenseCash: string
    expenseAccrual: string
  }
}

export interface FinanceCompanySettings {
  id: string
  key: string
  lockedExpenseThrough?: string | null
  updatedBy?: string
}

export interface FinanceBudgetVarianceRow {
  categoryId: string
  categoryName: string
  categoryCode?: string
  budget: number
  actual: number
  variance: number
  variancePct: number | null
  currency: string
}

export interface FinanceBudgetVariance {
  year: number
  month: number
  rows: FinanceBudgetVarianceRow[]
  totals: { budget: number; actual: number; variance: number }
}

export interface FinancePnl {
  from: string
  to: string
  revenue: number
  expensesTotal: number
  operatingMargin: number | null
  byCategory: { categoryId: string | null; categoryName: string; total: number; count: number }[]
}

export type FinanceStatementLineDirection = 'debit' | 'credit'
export type FinanceStatementLineMatchStatus = 'unmatched' | 'matched' | 'ignored'

export interface FinanceStatementBatch {
  id: string
  cashAccountId: string | FinanceRef
  fileName: string
  currency: string
  rowCount: number
  createdBy: string
  notes?: string
  createdAt?: string
}

export interface FinanceStatementLine {
  id: string
  batchId: string
  lineIndex: number
  postedAt: string
  narration: string
  amount: number
  direction: FinanceStatementLineDirection
  raw?: string
  matchStatus: FinanceStatementLineMatchStatus
  matchedExpenseId?: string | Pick<FinanceExpense, 'id' | 'title' | 'status' | 'amount' | 'expenseDate'>
  matchedAt?: string
}

export type FinanceRecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface FinanceRecurringExpense {
  id: string
  title: string
  amount: number
  taxAmount: number
  currency: string
  categoryId?: string | FinanceRef
  vendorId?: string | FinanceRef
  cashAccountId?: string | FinanceRef
  frequency: FinanceRecurringFrequency
  dayOfMonth: number
  dayOfWeek: number
  nextRunAt: string
  isActive: boolean
  generatedExpenseStatus: 'draft' | 'pending_approval'
  createdBy: string
  lastGeneratedExpenseId?: string
  lastGeneratedAt?: string
}
