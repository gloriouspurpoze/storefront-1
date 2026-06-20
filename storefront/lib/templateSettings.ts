import type { StorefrontConfig } from '@/lib/storefront-api'

export interface TemplateCheckoutSettings {
  showPreferredDateOfDelivery?: boolean
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

export interface DeliveryDetailsValue {
  addressLine1?: string
  addressLine2?: string
  city?: string
  pincode?: string
  preferredDate?: string
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
  if (extra?.trim()) parts.push(extra.trim())
  return parts.length ? parts.join('\n') : undefined
}

export function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}
