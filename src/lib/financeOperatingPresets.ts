import type { FinanceExpense, FinanceExpenseCategory } from '../types/finance.types'

export type OperatingCadence = 'daily' | 'monthly'

export interface OperatingExpensePreset {
  id: string
  /** Stable code stored on FinanceExpenseCategory — used to match API categories */
  code: string
  name: string
  cadence: OperatingCadence
  description: string
  /** Suggested title when logging a line item */
  titleHint: string
}

/** Industry-style OPEX presets: variable daily spend vs fixed monthly bills */
export const OPERATING_EXPENSE_PRESETS: OperatingExpensePreset[] = [
  {
    id: 'tea',
    code: 'OPS-TEA',
    name: 'Tea & coffee',
    cadence: 'daily',
    description: 'Pantry, vending, café runs for the team',
    titleHint: 'Tea / coffee',
  },
  {
    id: 'travel',
    code: 'OPS-TRAVEL',
    name: 'Local travel (auto / bus)',
    cadence: 'daily',
    description: 'Auto, bus, metro — day-to-day movement',
    titleHint: 'Travel — auto / bus',
  },
  {
    id: 'internet',
    code: 'OPS-INTERNET',
    name: 'Internet / broadband',
    cadence: 'monthly',
    description: 'Office or co-working connectivity',
    titleHint: 'Internet / broadband',
  },
  {
    id: 'mobile',
    code: 'OPS-MOBILE',
    name: 'Mobile / telecom',
    cadence: 'monthly',
    description: 'Postpaid, SIMs, team phone lines',
    titleHint: 'Mobile / telecom',
  },
  {
    id: 'rent',
    code: 'OPS-RENT',
    name: 'Rent & lease',
    cadence: 'monthly',
    description: 'Office, warehouse, parking',
    titleHint: 'Rent / lease',
  },
  {
    id: 'aws',
    code: 'OPS-AWS',
    name: 'AWS',
    cadence: 'monthly',
    description: 'Amazon Web Services usage & support',
    titleHint: 'AWS',
  },
  {
    id: 'cloud',
    code: 'OPS-CLOUD',
    name: 'Other cloud & SaaS infra',
    cadence: 'monthly',
    description: 'GCP, Azure, CDNs, observability, core SaaS',
    titleHint: 'Cloud / SaaS infra',
  },
  {
    id: 'utilities',
    code: 'OPS-UTIL',
    name: 'Utilities',
    cadence: 'monthly',
    description: 'Electricity, water, gas, waste',
    titleHint: 'Utilities',
  },
]

const PRESET_CODES = new Set(OPERATING_EXPENSE_PRESETS.map((p) => p.code))

export function presetByCode(code: string): OperatingExpensePreset | undefined {
  return OPERATING_EXPENSE_PRESETS.find((p) => p.code === code)
}

export function categoryMatchesOperatingPreset(c: Pick<FinanceExpenseCategory, 'code'>): boolean {
  return !!(c.code && PRESET_CODES.has(c.code))
}

export function operatingCategoryIds(categories: FinanceExpenseCategory[]): Set<string> {
  return new Set(
    categories.filter((c) => c.isActive !== false && categoryMatchesOperatingPreset(c)).map((c) => c.id),
  )
}

export function expenseCategoryId(exp: FinanceExpense): string | null {
  const c = exp.categoryId
  if (!c) return null
  if (typeof c === 'object' && c && 'id' in c) return String((c as { id: string }).id)
  return String(c)
}

export function expenseInCalendarMonth(iso: string, year: number, month1to12: number): boolean {
  const d = new Date(iso)
  return !Number.isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() + 1 === month1to12
}

export function filterOperatingExpensesForMonth(
  expenses: FinanceExpense[],
  categories: FinanceExpenseCategory[],
  year: number,
  month1to12: number,
): FinanceExpense[] {
  const ids = operatingCategoryIds(categories)
  return expenses.filter((e) => {
    if (!e.expenseDate || e.status === 'void') return false
    if (!expenseInCalendarMonth(e.expenseDate, year, month1to12)) return false
    const cid = expenseCategoryId(e)
    return cid != null && ids.has(cid)
  })
}

export function presetForCategory(
  c: FinanceExpenseCategory,
): OperatingExpensePreset | undefined {
  return c.code ? presetByCode(c.code) : undefined
}

export function sumExpenseAmount(exp: FinanceExpense): number {
  return (exp.amount ?? 0) + (exp.taxAmount ?? 0)
}
