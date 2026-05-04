import { store } from '../../store'
import { TENANT_HEADER } from '../../lib/saasEnv'
import { api } from './base'
import type {
  FinanceBudgetLine,
  FinanceBudgetVariance,
  FinanceBulkImportResult,
  FinanceCashAccount,
  FinanceCategoryDetailResponse,
  FinanceCategoryMergeResult,
  FinanceCompanySettings,
  FinanceExpense,
  FinanceExpenseCategory,
  FinanceOverview,
  FinancePnl,
  FinanceRecurringExpense,
  FinanceStatementBatch,
  FinanceStatementLine,
  FinanceVendor,
  FinanceVendorDetailResponse,
  FinanceVendorMergeResult,
} from '../../types/finance.types'

const silent = { showSuccessToast: false, showLoading: false } as const

const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

export class FinanceService {
  private static authHeaders(): HeadersInit {
    const token = store.getState().auth?.token
    const tenantId = store.getState().tenant?.tenantId ?? null
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(tenantId ? { [TENANT_HEADER]: tenantId } : {}),
    }
  }

  /** CSV export returns raw `text/csv` (not JSON); triggers a browser download. */
  static async downloadExpensesCsv(fromIso: string, toIso: string, fileName?: string): Promise<void> {
    const qs = new URLSearchParams({ from: fromIso, to: toIso }).toString()
    const res = await fetch(`${API_ROOT}/finance/expenses/export?${qs}`, { headers: FinanceService.authHeaders() })
    if (!res.ok) {
      let message = `Export failed (${res.status})`
      try {
        const j = (await res.json()) as { message?: string; error?: { message?: string } }
        message = j.message || j.error?.message || message
      } catch {
        /* non-JSON error body */
      }
      throw new Error(message)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || `expenses-${fromIso.slice(0, 10)}_${toIso.slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  static getOverview(months = 6) {
    return api.get<FinanceOverview>('/finance/overview', {
      params: { months: String(months) },
      ...silent,
    })
  }

  static getPnl(from: string, to: string) {
    return api.get<FinancePnl>('/finance/pnl', { params: { from, to }, ...silent })
  }

  static getFinanceSettings() {
    return api.get<FinanceCompanySettings>('/finance/settings', silent)
  }

  static updateFinanceSettings(body: { lockedExpenseThrough?: string | null }) {
    return api.put<FinanceCompanySettings>('/finance/settings', body, {
      loadingMessage: 'Saving…',
      successMessage: 'Finance settings updated.',
    })
  }

  static getBudgetVariance(year: number, month: number) {
    return api.get<FinanceBudgetVariance>('/finance/budgets/variance', {
      params: { year: String(year), month: String(month) },
      ...silent,
    })
  }

  static listAccounts() {
    return api.get<FinanceCashAccount[]>('/finance/accounts', silent)
  }

  static createAccount(body: Partial<FinanceCashAccount>) {
    return api.post<FinanceCashAccount>('/finance/accounts', body, {
      loadingMessage: 'Saving account…',
      successMessage: 'Account saved.',
    })
  }

  static updateAccount(id: string, body: Partial<FinanceCashAccount>) {
    return api.put<FinanceCashAccount>(`/finance/accounts/${id}`, body, {
      loadingMessage: 'Updating…',
      successMessage: 'Account updated.',
    })
  }

  static listVendors(activeOnly?: boolean) {
    return api.get<FinanceVendor[]>('/finance/vendors', {
      params: activeOnly ? { active: 'true' } : undefined,
      ...silent,
    })
  }

  static createVendor(body: Partial<FinanceVendor>) {
    return api.post<FinanceVendor>('/finance/vendors', body, {
      successMessage: 'Vendor added.',
    })
  }

  static updateVendor(id: string, body: Partial<FinanceVendor>) {
    return api.put<FinanceVendor>(`/finance/vendors/${id}`, body, {
      successMessage: 'Vendor updated.',
    })
  }

  static deleteVendor(id: string) {
    return api.delete<{ deleted: boolean }>(`/finance/vendors/${id}`, {
      successMessage: 'Vendor deleted.',
      errorMessage: 'Could not delete vendor',
    })
  }

  static getVendor(id: string) {
    return api.get<FinanceVendorDetailResponse>(`/finance/vendors/${id}`, silent)
  }

  static mergeVendors(fromVendorId: string, toVendorId: string) {
    return api.post<FinanceVendorMergeResult>(
      '/finance/vendors/merge',
      { fromVendorId, toVendorId },
      { successMessage: 'Vendors merged.', loadingMessage: 'Merging…' },
    )
  }

  static importVendors(rows: Array<Record<string, unknown>>) {
    return api.post<FinanceBulkImportResult>('/finance/vendors/import', { rows }, {
      successMessage: 'Vendor import finished.',
      loadingMessage: 'Importing…',
    })
  }

  static listCategories() {
    return api.get<FinanceExpenseCategory[]>('/finance/categories', silent)
  }

  static createCategory(body: Partial<FinanceExpenseCategory>) {
    return api.post<FinanceExpenseCategory>('/finance/categories', body, {
      successMessage: 'Category created.',
    })
  }

  static updateCategory(id: string, body: Partial<FinanceExpenseCategory>) {
    return api.put<FinanceExpenseCategory>(`/finance/categories/${id}`, body, {
      successMessage: 'Category updated.',
    })
  }

  static deleteCategory(id: string) {
    return api.delete<{ deleted: boolean }>(`/finance/categories/${id}`, {
      successMessage: 'Category deleted.',
      errorMessage: 'Could not delete category',
    })
  }

  static getCategory(id: string) {
    return api.get<FinanceCategoryDetailResponse>(`/finance/categories/${id}`, silent)
  }

  static mergeCategories(fromCategoryId: string, toCategoryId: string) {
    return api.post<FinanceCategoryMergeResult>(
      '/finance/categories/merge',
      { fromCategoryId, toCategoryId },
      { successMessage: 'Categories merged.', loadingMessage: 'Merging…' },
    )
  }

  static importCategories(rows: Array<Record<string, unknown>>) {
    return api.post<FinanceBulkImportResult>('/finance/categories/import', { rows }, {
      successMessage: 'Category import finished.',
      loadingMessage: 'Importing…',
    })
  }

  static listExpenses(params: Record<string, string | number | undefined>) {
    return api.get<FinanceExpense[]>('/finance/expenses', {
      params: params as Record<string, string>,
      ...silent,
    })
  }

  static getExpense(id: string) {
    return api.get<FinanceExpense>(`/finance/expenses/${id}`, silent)
  }

  static createExpense(body: Record<string, unknown>) {
    return api.post<FinanceExpense>('/finance/expenses', body, {
      successMessage: 'Expense recorded.',
    })
  }

  static updateExpense(id: string, body: Record<string, unknown>) {
    return api.put<FinanceExpense>(`/finance/expenses/${id}`, body, {
      successMessage: 'Expense updated.',
    })
  }

  static approveExpense(id: string) {
    return api.post<FinanceExpense>(`/finance/expenses/${id}/approve`, {}, { successMessage: 'Approved.' })
  }

  static rejectExpense(id: string, reason: string) {
    return api.post<FinanceExpense>(`/finance/expenses/${id}/reject`, { reason }, { successMessage: 'Rejected.' })
  }

  static markPaid(id: string, paidAt?: string) {
    return api.post<FinanceExpense>(`/finance/expenses/${id}/mark-paid`, { paidAt }, { successMessage: 'Marked paid.' })
  }

  static voidExpense(id: string) {
    return api.post<FinanceExpense>(`/finance/expenses/${id}/void`, {}, { successMessage: 'Voided.' })
  }

  static listBudgetLines(year: number, month: number) {
    return api.get<FinanceBudgetLine[]>('/finance/budgets', {
      params: { year: String(year), month: String(month) },
      ...silent,
    })
  }

  static upsertBudgetLine(body: {
    year: number
    month: number
    categoryId: string
    amount: number
    currency?: string
    notes?: string
  }) {
    return api.put<FinanceBudgetLine>('/finance/budgets/lines', body, { successMessage: 'Budget saved.' })
  }

  static deleteBudgetLine(id: string) {
    return api.delete<{ deleted: boolean }>(`/finance/budgets/lines/${id}`, { successMessage: 'Budget line removed.' })
  }

  static listStatementBatches(params?: Record<string, string>) {
    return api.get<FinanceStatementBatch[]>('/finance/reconciliation/batches', {
      params,
      ...silent,
    })
  }

  static createStatementBatch(body: {
    cashAccountId: string
    fileName: string
    currency?: string
    notes?: string
    lines: Array<{
      postedAt: string
      narration: string
      amount: number
      direction: 'debit' | 'credit'
      raw?: string
    }>
  }) {
    return api.post<FinanceStatementBatch>('/finance/reconciliation/batches', body, {
      successMessage: 'Statement imported.',
    })
  }

  static getStatementBatch(batchId: string) {
    return api.get<FinanceStatementBatch>(`/finance/reconciliation/batches/${batchId}`, silent)
  }

  static listStatementLines(batchId: string, params?: Record<string, string>) {
    return api.get<FinanceStatementLine[]>(`/finance/reconciliation/batches/${batchId}/lines`, {
      params,
      ...silent,
    })
  }

  static patchStatementLine(
    lineId: string,
    body: { matchStatus?: 'unmatched' | 'matched' | 'ignored'; matchedExpenseId?: string | null },
  ) {
    return api.patch<FinanceStatementLine>(`/finance/reconciliation/lines/${lineId}`, body, {
      successMessage: 'Line updated.',
    })
  }

  static statementLineSuggestions(lineId: string, limit = 8) {
    return api.get<FinanceExpense[]>(`/finance/reconciliation/lines/${lineId}/suggestions`, {
      params: { limit: String(limit) },
      ...silent,
    })
  }

  static createExpenseFromStatementLine(lineId: string, body?: Record<string, unknown>) {
    return api.post<FinanceExpense>(`/finance/reconciliation/lines/${lineId}/create-expense`, body ?? {}, {
      successMessage: 'Expense created from line.',
    })
  }

  static listRecurring(activeOnly?: boolean) {
    return api.get<FinanceRecurringExpense[]>('/finance/recurring', {
      params: activeOnly ? { active: 'true' } : undefined,
      ...silent,
    })
  }

  static listRecurringDue(limit = 25) {
    return api.get<FinanceRecurringExpense[]>('/finance/recurring/due', {
      params: { limit: String(limit) },
      ...silent,
    })
  }

  static createRecurring(body: Record<string, unknown>) {
    return api.post<FinanceRecurringExpense>('/finance/recurring', body, {
      successMessage: 'Recurring template saved.',
    })
  }

  static updateRecurring(id: string, body: Record<string, unknown>) {
    return api.put<FinanceRecurringExpense>(`/finance/recurring/${id}`, body, {
      successMessage: 'Template updated.',
    })
  }

  static deleteRecurring(id: string) {
    return api.delete<{ deleted: boolean }>(`/finance/recurring/${id}`, { successMessage: 'Template removed.' })
  }

  static generateRecurring(id: string, expenseDate?: string) {
    return api.post<FinanceExpense>(`/finance/recurring/${id}/generate`, { expenseDate }, { successMessage: 'Expense generated.' })
  }
}
