import type { StorefrontConfig } from '@/lib/storefront-api'
import {
  getMinDeliveryDate,
  getDeliveryTimeBounds,
  validateDeliverySlot,
  type OrderingAvailabilityConfig,
  type OrderingHoursConfig,
} from '@/lib/orderingHours'

export interface TemplateCheckoutSettings {
  showPreferredDateOfDelivery?: boolean
  showPreferredTimeOfDelivery?: boolean
}

export type TemplateSettingsMap = Record<string, TemplateCheckoutSettings>

export function getTemplateCheckoutSettings(
  config: StorefrontConfig | null | undefined,
  themeKey?: string,
): TemplateCheckoutSettings {
  if (!themeKey || !config?.templateSettings) return {}
  return config.templateSettings[themeKey] ?? {}
}

export function showPreferredDateOfDelivery(
  config: StorefrontConfig | null | undefined,
  themeKey?: string,
): boolean {
  return Boolean(getTemplateCheckoutSettings(config, themeKey).showPreferredDateOfDelivery)
}

export function showPreferredTimeOfDelivery(
  config: StorefrontConfig | null | undefined,
  themeKey?: string,
): boolean {
  return Boolean(getTemplateCheckoutSettings(config, themeKey).showPreferredTimeOfDelivery)
}

export interface DeliveryDetailsValue {
  addressLine1?: string
  addressLine2?: string
  city?: string
  pincode?: string
  preferredDate?: string
  preferredTime?: string
}

export type DeliveryDetailsValidation =
  | { ok: true }
  | { ok: false; message: string }

export function validateDeliveryDetails(
  details: Partial<DeliveryDetailsValue>,
  hours: OrderingHoursConfig,
  opts: {
    requireDate?: boolean
    requireTime?: boolean
    availability?: OrderingAvailabilityConfig | null
  },
): DeliveryDetailsValidation {
  if (opts.requireDate && !details.preferredDate?.trim()) {
    return { ok: false, message: 'Please choose a delivery date.' }
  }
  if (opts.requireTime && !details.preferredTime?.trim()) {
    return { ok: false, message: 'Please choose a delivery time.' }
  }
  if (!details.preferredDate?.trim()) {
    return opts.requireDate || opts.requireTime
      ? { ok: false, message: 'Please choose a delivery date.' }
      : { ok: true }
  }
  return validateDeliverySlot(
    hours,
    details.preferredDate,
    details.preferredTime,
    undefined,
    opts.availability,
  )
}

export function formatDeliveryNotes(
  details: Partial<DeliveryDetailsValue>,
  extra?: string,
): string | undefined {
  const parts: string[] = []
  const address = [details.addressLine1, details.addressLine2, details.city, details.pincode]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(', ')
  if (address) parts.push(`Delivery address: ${address}`)
  if (details.preferredDate?.trim()) {
    parts.push(`Preferred delivery date: ${details.preferredDate.trim()}`)
  }
  if (details.preferredTime?.trim()) {
    parts.push(`Preferred delivery time: ${details.preferredTime.trim()}`)
  }
  if (extra?.trim()) parts.push(extra.trim())
  return parts.length ? parts.join('\n') : undefined
}

export function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}
