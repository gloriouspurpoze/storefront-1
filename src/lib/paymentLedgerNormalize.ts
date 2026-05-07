import type { Payment } from '../types'

/** Map Payment ledger row from API (snake_case and camelCase) to admin Payment shape */
export function normalizeLedgerPaymentRow(raw: Record<string, unknown>): Payment {
  const id = String(raw.id ?? raw._id ?? '')
  const bookingId = String(raw.bookingId ?? raw.booking_id ?? '')
  const amount = Number(raw.amount ?? 0)
  const currency = String(raw.currency ?? 'INR')
  const statusRaw = String(raw.status ?? 'pending')
  const paymentMethod = String(raw.paymentMethod ?? raw.payment_method ?? '')
  const transactionId =
    raw.transactionId != null
      ? String(raw.transactionId)
      : raw.transaction_id != null
        ? String(raw.transaction_id)
        : undefined
  const createdAt = String(raw.createdAt ?? raw.created_at ?? new Date().toISOString())
  const updatedAt =
    raw.updatedAt != null ? String(raw.updatedAt) : raw.updated_at != null ? String(raw.updated_at) : undefined
  const completedAt =
    raw.completedAt != null
      ? String(raw.completedAt)
      : raw.completed_at != null
        ? String(raw.completed_at)
        : undefined

  const allowed: Payment['status'][] = ['pending', 'completed', 'failed', 'refunded']
  const status = (allowed.includes(statusRaw as Payment['status'])
    ? statusRaw
    : 'pending') as Payment['status']

  return {
    id,
    bookingId,
    amount,
    currency,
    status,
    paymentMethod,
    transactionId,
    createdAt,
    updatedAt,
    completedAt,
    serviceName:
      raw.serviceName != null
        ? String(raw.serviceName)
        : raw.service != null
          ? String(raw.service)
          : undefined,
  }
}

export function normalizeLedgerPaymentsList(raw: unknown): Payment[] {
  if (raw == null) return []
  const arr = Array.isArray(raw) ? raw : (raw as { payments?: unknown[] })?.payments
  if (!Array.isArray(arr)) return []
  return arr.map((r) =>
    normalizeLedgerPaymentRow(r && typeof r === 'object' ? (r as Record<string, unknown>) : {}),
  )
}
