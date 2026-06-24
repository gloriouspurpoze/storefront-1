/** Mirrors fixer-backend email template categories for admin UI grouping. */

export type EmailTemplateCategory =
  | 'bookings'
  | 'orders'
  | 'service_requests'
  | 'invoices'
  | 'team'
  | 'marketing'

export const EMAIL_TEMPLATE_CATEGORY_LABELS: Record<EmailTemplateCategory, string> = {
  bookings: 'Bookings',
  orders: 'Orders',
  service_requests: 'Service requests',
  invoices: 'Invoices & payouts',
  team: 'Team & admin',
  marketing: 'Marketing',
}

export const EMAIL_TEMPLATE_CATEGORY_ORDER: EmailTemplateCategory[] = [
  'bookings',
  'orders',
  'service_requests',
  'invoices',
  'team',
  'marketing',
]

export function categoryForEmailTemplateId(id: string): EmailTemplateCategory {
  if (id.startsWith('booking')) return 'bookings'
  if (id.startsWith('order')) return 'orders'
  if (id.startsWith('serviceRequest')) return 'service_requests'
  if (id.startsWith('invoice')) return 'invoices'
  if (id.startsWith('team')) return 'team'
  return 'marketing'
}

export function groupEmailTemplatesByCategory<T extends { id: string }>(
  items: T[],
): Array<{ category: EmailTemplateCategory; label: string; items: T[] }> {
  const buckets = new Map<EmailTemplateCategory, T[]>()
  for (const item of items) {
    const cat = categoryForEmailTemplateId(item.id)
    const list = buckets.get(cat) ?? []
    list.push(item)
    buckets.set(cat, list)
  }
  return EMAIL_TEMPLATE_CATEGORY_ORDER.filter((c) => buckets.has(c)).map((category) => ({
    category,
    label: EMAIL_TEMPLATE_CATEGORY_LABELS[category],
    items: buckets.get(category)!,
  }))
}

export function insertAtCursor(
  textarea: HTMLTextAreaElement | null,
  token: string,
  current: string,
  onChange: (next: string) => void,
): void {
  if (!textarea) {
    onChange(`${current}${token}`)
    return
  }
  const start = textarea.selectionStart ?? current.length
  const end = textarea.selectionEnd ?? current.length
  const next = `${current.slice(0, start)}${token}${current.slice(end)}`
  onChange(next)
  requestAnimationFrame(() => {
    textarea.focus()
    const pos = start + token.length
    textarea.setSelectionRange(pos, pos)
  })
}
