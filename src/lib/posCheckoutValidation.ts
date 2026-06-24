import { normalizePhoneForRegister } from './posCustomer'

export type PosCheckoutFieldErrors = Partial<
  Record<
    | 'customer'
    | 'cart'
    | 'scheduled'
    | 'addrLine'
    | 'addrCity'
    | 'addrState'
    | 'addrZip'
    | 'addrCountry'
    | 'phone'
    | 'splitTender',
    string
  >
>

export type PosCheckoutValidationInput = {
  hasCustomer: boolean
  cartLineCount: number
  scheduledLocal: string
  addrLine: string
  addrCity: string
  addrState: string
  addrZip: string
  addrCountry: string
  /** Resolved service / contact phone (customer profile or address field). */
  phone: string
  useSplitTender: boolean
  splitOk: boolean
  grandTotal: number
  /** Allow bookings starting up to N minutes in the past (desk clock skew). */
  scheduleGraceMinutes?: number
}

export function isValidIndianPincode(pin: string): boolean {
  return /^\d{6}$/.test(String(pin || '').trim())
}

export function isValidPosServicePhone(phone: string): boolean {
  const raw = String(phone || '').trim()
  if (!raw) return false
  const normalized = normalizePhoneForRegister(raw)
  return /^\+[1-9]\d{7,14}$/.test(normalized)
}

function isIndiaCountry(country: string): boolean {
  const c = String(country || '').trim().toLowerCase()
  return !c || c === 'india' || c === 'in'
}

export function validatePosCheckoutForm(
  input: PosCheckoutValidationInput,
): { valid: boolean; errors: PosCheckoutFieldErrors; messages: string[] } {
  const errors: PosCheckoutFieldErrors = {}
  const messages: string[] = []

  const push = (key: keyof PosCheckoutFieldErrors, message: string) => {
    errors[key] = message
    messages.push(message)
  }

  if (!input.hasCustomer) {
    push('customer', 'Select or add a customer before committing.')
  }

  if (input.cartLineCount <= 0) {
    push('cart', 'Add at least one service or part to the ticket.')
  }

  const scheduledRaw = String(input.scheduledLocal || '').trim()
  if (!scheduledRaw) {
    push('scheduled', 'Choose a scheduled start date and time.')
  } else {
    const scheduledAt = new Date(scheduledRaw)
    if (Number.isNaN(scheduledAt.getTime())) {
      push('scheduled', 'Scheduled start is not a valid date and time.')
    } else {
      const graceMs = (input.scheduleGraceMinutes ?? 5) * 60 * 1000
      const minAt = Date.now() - graceMs
      const maxAt = Date.now() + 366 * 24 * 60 * 60 * 1000
      if (scheduledAt.getTime() < minAt) {
        push('scheduled', 'Scheduled start cannot be in the past.')
      } else if (scheduledAt.getTime() > maxAt) {
        push('scheduled', 'Scheduled start is too far in the future (max ~1 year).')
      }
    }
  }

  const line = String(input.addrLine || '').trim()
  if (line.length < 3) {
    push('addrLine', 'Enter street / landmark (at least 3 characters).')
  }

  const city = String(input.addrCity || '').trim()
  if (city.length < 2) {
    push('addrCity', 'Enter the service city.')
  }

  const state = String(input.addrState || '').trim()
  if (state.length < 2) {
    push('addrState', 'Enter the state.')
  }

  const country = String(input.addrCountry || '').trim()
  if (country.length < 2) {
    push('addrCountry', 'Enter the country.')
  }

  const zip = String(input.addrZip || '').trim()
  if (isIndiaCountry(country)) {
    if (!isValidIndianPincode(zip)) {
      push('addrZip', 'Enter a valid 6-digit PIN code.')
    }
  } else if (zip.length > 0 && zip.length < 3) {
    push('addrZip', 'Enter a valid postal / ZIP code.')
  }

  if (!isValidPosServicePhone(input.phone)) {
    push(
      'phone',
      'Customer mobile is required for SMS and tracking (10-digit India or +country…).',
    )
  }

  if (input.grandTotal < 0) {
    push('cart', 'Total due cannot be negative — adjust discounts.')
  }

  if (input.useSplitTender && !input.splitOk) {
    push('splitTender', 'Split tender amounts must match total due (±₹0.05).')
  }

  return { valid: messages.length === 0, errors, messages }
}

/** Minimum value for `<input type="datetime-local" />` (local timezone). */
export function posScheduledMinLocalValue(graceMinutes = 5): string {
  const d = new Date(Date.now() - graceMinutes * 60 * 1000)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/** Maximum value for `<input type="datetime-local" />` (~1 year). */
export function posScheduledMaxLocalValue(): string {
  const d = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/** Sanitize PIN input to digits only, max 6. */
export function sanitizeIndianPinInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 6)
}
