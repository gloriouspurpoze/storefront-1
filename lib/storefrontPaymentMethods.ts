import type { StorefrontConfig } from '@/lib/storefront-api'

export type StorefrontPaymentMethod = 'razorpay' | 'cod' | 'pay_at_restaurant'

export const STOREFRONT_PAYMENT_METHOD_LABELS: Record<StorefrontPaymentMethod, string> = {
  razorpay: 'Pay online',
  cod: 'Cash on delivery',
  pay_at_restaurant: 'Pay at restaurant',
}

export const STOREFRONT_PAYMENT_SUBMIT_LABELS: Record<StorefrontPaymentMethod, string> = {
  razorpay: 'Pay & place order',
  cod: 'Place order (COD)',
  pay_at_restaurant: 'Place order (pay at restaurant)',
}

function flagOn(config: StorefrontConfig | null, key: string): boolean {
  const flags = config?.featureFlags as Record<string, boolean | undefined> | undefined
  return flags?.[key] === true
}

/** Enabled payment methods for checkout UI (order preserved). */
export function getEnabledPaymentMethods(config: StorefrontConfig | null): StorefrontPaymentMethod[] {
  const methods: StorefrontPaymentMethod[] = []
  const flags = config?.featureFlags as Record<string, boolean | undefined> | undefined

  if (flags?.enableRazorpayPayment !== false) {
    methods.push('razorpay')
  }
  if (flagOn(config, 'enableCodPayment')) {
    methods.push('cod')
  }
  if (flagOn(config, 'enablePayAtRestaurantPayment')) {
    methods.push('pay_at_restaurant')
  }

  return methods.length ? methods : ['razorpay']
}

export function isWhatsAppOrderEnabled(config: StorefrontConfig | null): boolean {
  const flags = config?.featureFlags as Record<string, boolean | undefined> | undefined
  if (flags?.showWhatsAppButton === false) return false
  const whatsapp =
    config?.branding?.socials?.whatsapp?.trim() || config?.branding?.contactPhone?.trim()
  return Boolean(whatsapp)
}

export function isOfferMarqueeEnabled(config: StorefrontConfig | null): boolean {
  const flags = config?.featureFlags as Record<string, boolean | undefined> | undefined
  return flags?.showOfferMarquee !== false
}
