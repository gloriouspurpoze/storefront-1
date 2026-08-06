/** Checkout contact helpers for signed-in storefront customers. */

import type { StorefrontAuthUser } from './storefront-auth'
import type { DeliveryDetailsValue } from './templateSettings'

export function normalizeIndianMobileDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

/** Format a 10-digit Indian mobile for PATCH /auth/profile (`+91…`). */
export function toProfilePhoneE164(phone: string): string | undefined {
  const digits = normalizeIndianMobileDigits(phone)
  if (digits.length !== 10) return undefined
  return `+91${digits}`
}

/** Map saved `/addresses` record → checkout delivery fields. */
export function deliveryPrefillFromSavedAddress(
  addr:
    | {
        street?: string
        apartment?: string
        city?: string
        zipCode?: string
        state?: string
      }
    | null
    | undefined,
): DeliveryDetailsValue {
  if (!addr) return {}
  const addressLine1 = addr.street?.trim() || ''
  const city = addr.city?.trim() || ''
  const pincode = addr.zipCode?.trim() || ''
  if (!addressLine1 && !city && !pincode) return {}
  const apartment = addr.apartment?.trim()
  const state = addr.state?.trim()
  return {
    addressLine1,
    ...(apartment ? { addressLine2: apartment } : {}),
    city,
    pincode,
    ...(state ? { state } : {}),
  }
}

/** Single-line address for themes that use one free-text delivery field. */
export function formatSavedAddressLine(
  details: Pick<DeliveryDetailsValue, 'addressLine1' | 'addressLine2' | 'city' | 'pincode'>,
): string {
  return [details.addressLine1, details.addressLine2, details.city, details.pincode]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(', ')
}

const PLACEHOLDER_EMAIL_SUFFIXES = [
  '@customers.placeholder',
  '@phone.profixer.local',
  '@temp.com',
] as const

export function isRealCustomerEmail(email?: string): boolean {
  const trimmed = email?.trim().toLowerCase() ?? ''
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false
  return !PLACEHOLDER_EMAIL_SUFFIXES.some((suffix) => trimmed.endsWith(suffix))
}

export function isValidCustomerEmail(email: string): boolean {
  return isRealCustomerEmail(email)
}

export function checkoutPrefillFromUser(user: StorefrontAuthUser | null | undefined) {
  if (!user) {
    return {
      email: '',
      name: '',
      phone: '',
      lockedEmail: false,
      signedIn: false,
    }
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  const hasRealEmail = isRealCustomerEmail(user.email)
  const phone = user.phone ? normalizeIndianMobileDigits(user.phone) : ''

  return {
    email: hasRealEmail ? user.email.trim().toLowerCase() : '',
    name,
    phone,
    lockedEmail: hasRealEmail,
    signedIn: true,
  }
}

export function resolveCheckoutContactForSubmit(input: {
  formEmail?: string
  formName?: string
  formPhone?: string
  authUser?: StorefrontAuthUser | null
}):
  | { ok: true; email: string; name: string; phone: string }
  | { ok: false; message: string } {
  const prefill = checkoutPrefillFromUser(input.authUser ?? null)
  const formName = input.formName?.trim() ?? ''
  const formPhone = input.formPhone?.trim() ?? ''
  const formEmail = input.formEmail?.trim().toLowerCase() ?? ''

  const name = formName || prefill.name
  const phone = formPhone || prefill.phone || undefined

  let email = ''
  if (prefill.lockedEmail && prefill.email) {
    email = prefill.email
  } else if (formEmail && isValidCustomerEmail(formEmail)) {
    email = formEmail
  }

  if (!name) {
    return { ok: false, message: 'Please enter your name.' }
  }

  const phoneDigits = normalizeIndianMobileDigits(phone ?? '')
  if (!phoneDigits || phoneDigits.length < 10) {
    return { ok: false, message: 'Please enter a valid phone number.' }
  }

  // Never invent @customers.placeholder — the public checkout API rejects non-TLD emails.
  if (!isRealCustomerEmail(email)) {
    return { ok: false, message: 'Please enter a valid email.' }
  }

  return { ok: true, email, name, phone: phoneDigits }
}
