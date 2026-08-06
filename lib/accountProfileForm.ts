import type { CustomerProfile, CustomerSavedAddress } from '@/lib/storefront-api'
import { normalizeIndianMobileDigits } from '@/lib/storefrontCustomerContact'

export type ProfileForm = {
  firstName: string
  lastName: string
  phone: string
  street: string
  apartment: string
  city: string
  state: string
  zipCode: string
}

export type ProfileFieldErrors = Partial<Record<keyof ProfileForm, string>>

export function emptyProfileForm(): ProfileForm {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
  }
}

export function profileFormFromSources(
  profile: CustomerProfile | null,
  address: CustomerSavedAddress | null,
  fallback?: { firstName?: string; lastName?: string; phone?: string },
): ProfileForm {
  const rawLast = profile?.lastName ?? fallback?.lastName ?? ''
  return {
    firstName: profile?.firstName ?? fallback?.firstName ?? '',
    lastName: rawLast === '.' ? '' : rawLast,
    phone: normalizeIndianMobileDigits(profile?.phone ?? fallback?.phone ?? ''),
    street: address?.street ?? '',
    apartment: address?.apartment ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    zipCode: address?.zipCode ?? '',
  }
}

export function validateProfileForm(form: ProfileForm): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {}
  if (!form.firstName.trim()) errors.firstName = 'First name is required.'
  else if (form.firstName.trim().length > 50) errors.firstName = 'First name is too long.'

  if (form.lastName.trim().length > 50) errors.lastName = 'Last name is too long.'

  const phoneDigits = normalizeIndianMobileDigits(form.phone)
  if (!phoneDigits || phoneDigits.length !== 10) {
    errors.phone = 'Enter a valid 10-digit mobile number.'
  }

  if (!form.street.trim()) errors.street = 'Street address is required.'
  if (!form.city.trim()) errors.city = 'City is required.'
  if (!form.state.trim()) errors.state = 'State is required.'
  if (!/^\d{6}$/.test(form.zipCode.trim())) {
    errors.zipCode = 'Enter a valid 6-digit PIN code.'
  }

  return errors
}

export function isProfileFormIncomplete(form: ProfileForm): boolean {
  return Object.keys(validateProfileForm(form)).length > 0
}
