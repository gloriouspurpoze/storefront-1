/** POS desk — how staff attach a customer to a booking. */
export type PosCustomerRegisterMode = 'walk_in' | 'full_account'

export type PosCustomerRegisterModeInfo = {
  id: PosCustomerRegisterMode
  label: string
  badge: string
  summary: string
  whenToUse: string[]
  afterCreate: string
}

export const POS_CUSTOMER_REGISTER_MODES: Record<PosCustomerRegisterMode, PosCustomerRegisterModeInfo> = {
  walk_in: {
    id: 'walk_in',
    label: 'Walk-in / phone-first',
    badge: 'Recommended',
    summary: 'Phone and name only — no password at the counter.',
    whenToUse: [
      'Walk-in or phone desk bookings',
      'Customer tracks the job via SMS / link or OTP later',
      'Same mobile number merges history when they sign in',
    ],
    afterCreate:
      'After commit, share the booking ID. Customer can claim the profile later with OTP on the consumer site.',
  },
  full_account: {
    id: 'full_account',
    label: 'Full account now',
    badge: 'Email + password',
    summary: 'Creates login credentials immediately for app / web access.',
    whenToUse: [
      'Customer wants to log in today',
      'GST invoice or receipts need a real email on file',
      'Account-specific coupons or wallet balance',
    ],
    afterCreate:
      'Share the temporary password securely, or reset it from Users / Support after the visit.',
  },
}

export const POS_CUSTOMER_PATHS = [
  {
    step: '1',
    title: 'Search directory',
    detail: 'Returning customers — search by name, email, or phone in the ticket panel.',
  },
  {
    step: '2',
    title: 'Walk-in (phone-first)',
    detail: 'Default at the counter — books under their mobile; no password handoff.',
  },
  {
    step: '3',
    title: 'Full account',
    detail: 'Use when they need email + password login before they leave.',
  },
] as const

/** Public `/auth/register` expects E.164-style phone starting with + and country digit 1–9 */
export function normalizePhoneForRegister(raw: string): string {
  const s = raw.replace(/\s/g, '')
  if (!s) return s
  if (s.startsWith('+')) return s
  const digits = s.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`
  return s
}

export function phonesMatch(a: string | undefined | null, b: string | undefined | null): boolean {
  const da = (a || '').replace(/\D/g, '')
  const db = (b || '').replace(/\D/g, '')
  if (!da || !db) return false
  if (da === db) return true
  return da.endsWith(db) || db.endsWith(da)
}

/** Internal placeholder when walk-in has no email — not shown to the customer. */
export function walkInPlaceholderEmail(normalizedPhone: string): string {
  const digits = normalizedPhone.replace(/\D/g, '') || 'unknown'
  return `walkin.${digits}@pos.internal`
}

export function generatePosCustomerPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const special = '@$!%*?&'
  const all = upper + lower + digits + special
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)]!
  const chars = [pick(upper), pick(lower), pick(digits), pick(special)]
  for (let i = 0; i < 8; i++) chars.push(pick(all))
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  return chars.join('')
}

/** Parse search box text into prefill hints for the add-customer dialog. */
export function parseCustomerSearchPrefill(query: string): {
  firstName: string
  lastName: string
  email: string
  phone: string
} {
  const q = query.trim()
  if (!q) {
    return { firstName: '', lastName: '', email: '', phone: '' }
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q)) {
    return { firstName: '', lastName: '', email: q, phone: '' }
  }
  const digits = q.replace(/\D/g, '')
  if (digits.length >= 10) {
    return { firstName: '', lastName: '', email: '', phone: q }
  }
  const parts = q.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: '', email: '', phone: '' }
  }
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(' '),
    email: '',
    phone: '',
  }
}

export type PosCustomerResolveResult = {
  user: import('../types').User
  created: boolean
  matchedExisting: boolean
  mode: PosCustomerRegisterMode | 'existing'
  /** Only for full_account or legacy fallback — share securely at counter. */
  password?: string
  serverMessage?: string
}
