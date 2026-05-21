/**
 * Preview-only helpers aligned with fixer-backend `InvoiceService.generateInvoice`:
 * - Per line: GST is opt-in. When applied, rate defaults to 18% to match backend
 *   defaults but is now caller-driven so admins can choose 5 / 12 / 18 / 28% in
 *   the UI without affecting other consumers.
 * - Total: subtotal + totalTax − discount (discount applied after tax, not before).
 *
 * HSN/SAC map mirrors `src/services/InvoiceService.ts` HSN_CODES.
 */

import type { ManualInvoiceLineItem } from '../../services/api/invoices.service'

/** Standard Indian GST slabs offered in the UI. */
export const GST_RATE_CHOICES: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: 'Nil / exempt' },
  { value: 5, label: '5%' },
  { value: 12, label: '12%' },
  { value: 18, label: '18% (default)' },
  { value: 28, label: '28%' },
]

/** Backend `InvoiceService.GST_RATES` default; used only when caller opts into GST. */
export const DEFAULT_GST_RATE = 18

export const HSN_SAC_BY_CATEGORY: Record<string, string> = {
  'ac-repair': '998599',
  plumbing: '998599',
  electrical: '998599', // default service SAC when category omitted
  carpentry: '998599',
  painting: '998599',
  cleaning: '998599',
  subscription: '998599',
  product: '39269099',
  appliance: '39269099',
  hardware: '39269099',
}

export function hsnForCategory(category?: string): string {
  if (!category) return '998599'
  return HSN_SAC_BY_CATEGORY[category] || HSN_SAC_BY_CATEGORY.electrical || '998599'
}

export type LineComputed = {
  description: string
  quantity: number
  unitPrice: number
  category?: string
  lineKind?: string
  hsnSac: string
  taxable: number
  taxAmount: number
  lineTotal: number
}

export function computeInvoiceFromLines(
  items: ManualInvoiceLineItem[],
  discountInput: string | number,
  options?: { applyGst?: boolean; gstRate?: number }
): {
  lines: LineComputed[]
  subtotal: number
  totalTax: number
  discount: number
  grandTotal: number
  /** Effective GST rate applied (0 when not applied). */
  effectiveGstRate: number
} {
  // Backwards-compat: previously applyGst defaulted to true. Now GST is opt-in;
  // callers must pass `applyGst: true` explicitly.
  const applyGst = options?.applyGst === true
  const rawRate = options?.gstRate
  const rate = applyGst
    ? Math.max(0, Math.min(50, typeof rawRate === 'number' ? rawRate : DEFAULT_GST_RATE))
    : 0
  const clean = items.filter(
    (it) => it.description?.trim() && it.quantity > 0 && it.unitPrice >= 0
  )
  const lines: LineComputed[] = clean.map((it) => {
    const taxable = it.quantity * it.unitPrice
    const taxAmount = applyGst ? (taxable * rate) / 100 : 0
    const lineTotal = taxable + taxAmount
    const cat = it.category || (it.lineKind === 'product' ? 'product' : 'electrical')
    return {
      description: it.description.trim(),
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      category: it.category,
      lineKind: it.lineKind,
      hsnSac: hsnForCategory(cat),
      taxable,
      taxAmount,
      lineTotal,
    }
  })
  const subtotal = lines.reduce((s, l) => s + l.taxable, 0)
  const totalTax = lines.reduce((s, l) => s + l.taxAmount, 0)
  const discount = Math.max(0, typeof discountInput === 'string' ? parseFloat(discountInput) || 0 : discountInput)
  const grandTotal = Math.max(0, subtotal + totalTax - discount)
  return { lines, subtotal, totalTax, discount, grandTotal, effectiveGstRate: rate }
}

function normalizeState(s: string) {
  return s.trim().toLowerCase()
}

/**
 * Intra-state → CGST+SGST; inter-state → IGST (display split only; amounts match total GST).
 */
export function isInterStateForPreview(customerState: string, companyState: string): boolean {
  return normalizeState(customerState) !== normalizeState(companyState)
}
