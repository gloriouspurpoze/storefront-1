/** Maps internal order status → customer-facing label for emails. */
export const STOREFRONT_STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  processing: 'Preparing',
  shipped: 'Out for Delivery',
  delivered: 'Delivered',
}

export function storefrontStatusLabel(status: string): string {
  const key = status.toLowerCase().trim()
  return STOREFRONT_STATUS_LABELS[key] ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Statuses that trigger a customer status-update email (not confirmation). */
export const STOREFRONT_STATUS_EMAIL_STATUSES = new Set(['processing', 'shipped', 'delivered'])
