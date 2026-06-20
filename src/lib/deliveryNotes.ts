export interface ParsedDeliveryNotes {
  deliveryMethod?: string
  deliveryAddress?: string
  preferredDate?: string
  deliveryDate?: string
  deliveryTime?: string
  additionalNotes?: string
}

const DELIVERY_ADDRESS_PREFIX = 'Delivery address: '
const PREFERRED_DATE_PREFIX = 'Preferred delivery date: '
const DELIVERY_METHOD_PREFIX = 'Delivery: '
const DATE_PREFIX = 'Date: '
const TIME_PREFIX = 'Time: '
const ADDRESS_PREFIX = 'Address: '

/** Parses checkout notes from retail/restaurant templates and Brown Butter storefront. */
export function parseDeliveryNotes(notes?: string | null): ParsedDeliveryNotes | null {
  if (!notes?.trim()) return null

  let deliveryMethod: string | undefined
  let deliveryAddress: string | undefined
  let preferredDate: string | undefined
  let deliveryDate: string | undefined
  let deliveryTime: string | undefined
  const other: string[] = []

  for (const line of notes.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith(DELIVERY_ADDRESS_PREFIX)) {
      deliveryAddress = trimmed.slice(DELIVERY_ADDRESS_PREFIX.length).trim()
    } else if (trimmed.startsWith(PREFERRED_DATE_PREFIX)) {
      preferredDate = trimmed.slice(PREFERRED_DATE_PREFIX.length).trim()
    } else if (trimmed.startsWith(DELIVERY_METHOD_PREFIX)) {
      deliveryMethod = trimmed.slice(DELIVERY_METHOD_PREFIX.length).trim()
    } else if (trimmed.startsWith(DATE_PREFIX)) {
      deliveryDate = trimmed.slice(DATE_PREFIX.length).trim()
    } else if (trimmed.startsWith(TIME_PREFIX)) {
      deliveryTime = trimmed.slice(TIME_PREFIX.length).trim()
    } else if (trimmed.startsWith(ADDRESS_PREFIX) && !deliveryAddress) {
      deliveryAddress = trimmed.slice(ADDRESS_PREFIX.length).trim()
    } else {
      other.push(trimmed)
    }
  }

  const hasStructured =
    deliveryMethod ||
    deliveryAddress ||
    preferredDate ||
    deliveryDate ||
    deliveryTime

  if (!hasStructured && other.length === 0) return null

  return {
    deliveryMethod,
    deliveryAddress,
    preferredDate,
    deliveryDate,
    deliveryTime,
    additionalNotes: other.length ? other.join('\n') : undefined,
  }
}

/** Formats Brown Butter-style date (YYYY-MM-DD) and time (HH:MM) for admin display. */
export function formatDeliveryDateTime(date?: string, time?: string): string | null {
  const datePart = date?.trim()
  const timePart = time?.trim()

  if (!datePart) {
    return timePart || null
  }

  const [y, m, d] = datePart.split('-').map(Number)
  if (!y || !m || !d) {
    return timePart ? `${datePart}, ${timePart}` : datePart
  }

  if (timePart) {
    const [hh, mm] = timePart.split(':').map(Number)
    if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
      const dt = new Date(y, m - 1, d, hh, mm)
      return new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(dt)
    }
  }

  const dt = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(dt)
}

/** Best available customer-requested delivery window for an order. */
export function getOrderDeliveryWhen(order: {
  estimatedDeliveryAt?: string | null
  notes?: string | null
}): string | null {
  const parsed = parseDeliveryNotes(order.notes)
  if (parsed?.deliveryDate || parsed?.deliveryTime) {
    return formatDeliveryDateTime(parsed.deliveryDate, parsed.deliveryTime)
  }
  if (parsed?.preferredDate) {
    return parsed.preferredDate
  }
  if (order.estimatedDeliveryAt) {
    const dt = new Date(order.estimatedDeliveryAt)
    if (!Number.isNaN(dt.getTime())) {
      return new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(dt)
    }
  }
  return null
}

export function hasCustomerDeliveryDetails(parsed: ParsedDeliveryNotes | null): boolean {
  if (!parsed) return false
  return Boolean(
    parsed.deliveryMethod ||
      parsed.deliveryAddress ||
      parsed.preferredDate ||
      parsed.deliveryDate ||
      parsed.deliveryTime,
  )
}
