/**
 * fixer-backend `models/Invoice.ts` — `paymentMethod` is enum-only:
 * cash | online | upi | card | net_banking | wallet | credits
 * Free-text values (e.g. "Cash / UPI (offline)") cause Mongoose validation errors → HTTP 500.
 */
export const BACKEND_PAYMENT_METHODS = [
  'cash',
  'online',
  'upi',
  'card',
  'net_banking',
  'wallet',
  'credits',
] as const

export type BackendPaymentMethod = (typeof BACKEND_PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_CHOICES: { value: BackendPaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online / gateway' },
  { value: 'net_banking', label: 'NEFT / bank transfer' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'credits', label: 'Credits' },
]

export function normalizePaymentMethodForBackend(
  raw: string | undefined | null
): BackendPaymentMethod {
  if (raw == null || String(raw).trim() === '') return 'cash'
  const t = String(raw).trim().toLowerCase()
  if ((BACKEND_PAYMENT_METHODS as readonly string[]).includes(t)) {
    return t as BackendPaymentMethod
  }
  if (t.includes('upi')) return 'upi'
  if (t.includes('card')) return 'card'
  if (t.includes('neft') || t.includes('bank') || t.includes('transfer') || t.includes('imps')) {
    return 'net_banking'
  }
  if (t.includes('online')) return 'online'
  if (t.includes('wallet')) return 'wallet'
  if (t.includes('credit')) return 'credits'
  if (t.includes('cash')) return 'cash'
  return 'cash'
}

export function paymentMethodLabel(v: string | undefined): string {
  if (!v) return '—'
  const f = PAYMENT_METHOD_CHOICES.find((c) => c.value === v)
  return f?.label ?? v
}
