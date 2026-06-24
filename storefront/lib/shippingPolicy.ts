import type { StorefrontConfig } from '@/lib/storefront-api'

export interface ShippingPolicyZone {
  label: string
  details: string
  fee?: string
}

export interface ShippingPolicyConfig {
  summary?: string
  body?: string
  processingNote?: string
  zones?: ShippingPolicyZone[]
}

export function getShippingPolicyFromConfig(
  config: StorefrontConfig | null | undefined,
): ShippingPolicyConfig {
  const raw = config?.shippingPolicy
  if (!raw) return {}
  return {
    summary: raw.summary?.trim() || undefined,
    body: raw.body?.trim() || undefined,
    processingNote: raw.processingNote?.trim() || undefined,
    zones: raw.zones?.filter((z: ShippingPolicyZone) => z.label?.trim() || z.details?.trim()),
  }
}

export function hasShippingPolicyContent(policy: ShippingPolicyConfig): boolean {
  return Boolean(
    policy.summary ||
      policy.body ||
      policy.processingNote ||
      (policy.zones && policy.zones.length > 0),
  )
}

export const DEFAULT_SHIPPING_POLICY_SUMMARY =
  'Orders are typically processed within 1–2 business days after payment confirmation.'
