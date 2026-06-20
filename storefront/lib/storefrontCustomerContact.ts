/** Client-side mirror of backend storefront guest contact helpers. */

import type { StorefrontAuthUser } from './storefront-auth'

export function normalizeIndianMobileDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

export function buildStorefrontPlaceholderEmail(phone: string): string {
  return `${normalizeIndianMobileDigits(phone)}@customers.placeholder`
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
  } else if (phone) {
    email = resolveCheckoutCustomerEmail({ email: formEmail, phone })
  }

  if (!name) {
    return { ok: false, message: 'Please enter your name.' }
  }

  const phoneDigits = normalizeIndianMobileDigits(phone ?? '')
  if (!phoneDigits || phoneDigits.length < 10) {
    return { ok: false, message: 'Please enter a valid phone number.' }
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: 'Please enter a valid email.' }
  }

  return { ok: true, email, name, phone: phoneDigits }
}

export function resolveCheckoutCustomerEmail(input: {
  email?: string
  phone: string
}): string {
  const trimmedEmail = input.email?.trim().toLowerCase() ?? ''
  if (trimmedEmail && isValidCustomerEmail(trimmedEmail)) return trimmedEmail
  return buildStorefrontPlaceholderEmail(input.phone)
}
