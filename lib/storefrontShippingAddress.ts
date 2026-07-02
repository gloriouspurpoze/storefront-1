import type { DeliveryDetailsValue } from './templateSettings'

/** Payload accepted by POST /public/storefront/checkout/verify */
export interface StorefrontShippingAddressPayload {
  firstName: string
  lastName: string
  address: string
  city: string
  state?: string
  zipCode: string
  /** Duplicate of zipCode — some API paths persist `pincode` only. */
  pincode?: string
  country: string
  phone?: string
  email?: string
}

export function splitCustomerName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: 'Guest', lastName: 'Customer' }
  if (parts.length === 1) return { firstName: parts[0], lastName: 'Customer' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export function hasShippableDeliveryDetails(details: Partial<DeliveryDetailsValue>): boolean {
  return Boolean(
    details.addressLine1?.trim() || details.city?.trim() || details.pincode?.trim(),
  )
}

export function validateShippingAddress(
  details: Partial<DeliveryDetailsValue>,
): { ok: true } | { ok: false; message: string } {
  const line1 = details.addressLine1?.trim()
  const city = details.city?.trim()
  const pincode = details.pincode?.trim()
  if (!line1) return { ok: false, message: 'Please enter your street address.' }
  if (!city) return { ok: false, message: 'Please enter your city.' }
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return { ok: false, message: 'Please enter a valid 6-digit PIN code.' }
  }
  return { ok: true }
}

export function deliveryDetailsToShippingAddress(
  details: Partial<DeliveryDetailsValue>,
  customer: { name: string; email: string; phone?: string },
): StorefrontShippingAddressPayload | undefined {
  const check = validateShippingAddress(details)
  if (!check.ok) return undefined

  const { firstName, lastName } = splitCustomerName(customer.name)
  const street = [details.addressLine1, details.addressLine2]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(', ')

  const pin = details.pincode!.trim()

  return {
    firstName,
    lastName,
    address: street,
    city: details.city!.trim(),
    state: '',
    zipCode: pin,
    pincode: pin,
    country: 'India',
    phone: customer.phone?.trim() || undefined,
    email: customer.email.trim(),
  }
}
