/**
 * WhatsApp floating button helpers (paid add-on `showWhatsAppButton`).
 *
 * Pure — no React / config imports beyond types — so it can be unit-tested.
 * WhatsApp *ordering* at checkout lives in `storefrontPaymentMethods.ts` and is
 * intentionally independent of this add-on.
 */
import type { StorefrontConfig } from '@/lib/storefront-api'

/**
 * Normalise a phone / WhatsApp value to the digits `wa.me` expects
 * (country code + number, no `+`). Indian numbers are the default market:
 *
 *  - `98765 43210` / `098765-43210` → `919876543210`
 *  - `+91 98765 43210` / `0091…` / `91…` (12 digits) → `919876543210`
 *  - Other international numbers with `+` / `00` prefix keep their country code.
 *  - Full `wa.me/<digits>` or `api.whatsapp.com/send?phone=<digits>` links are accepted.
 *
 * Returns null when the value can't be a valid WhatsApp number.
 */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null
  let value = raw.trim()
  if (!value) return null

  const link = value.match(/(?:wa\.me\/|[?&]phone=)\+?([\d\s-]+)/i)
  if (link) value = link[1]

  const hasPlus = value.startsWith('+')
  let digits = value.replace(/\D/g, '')
  if (!digits) return null

  if (!hasPlus && digits.startsWith('00')) {
    digits = digits.slice(2)
  } else if (!hasPlus) {
    // Domestic Indian formats: trunk `0` + 10-digit mobile, or bare 10-digit mobile.
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
    if (digits.length === 10 && /^[6-9]/.test(digits)) digits = `91${digits}`
  }

  // E.164 allows up to 15 digits; anything under 8 (CC + subscriber) is not dialable.
  if (digits.length < 8 || digits.length > 15) return null
  return digits
}

/** Prefer `branding.socials.whatsapp`, fall back to `branding.contactPhone`. */
export function resolveWhatsAppNumber(cfg: StorefrontConfig | null | undefined): string | null {
  const socials = cfg?.branding?.socials
  return (
    normalizeWhatsAppNumber(socials?.whatsapp) ?? normalizeWhatsAppNumber(cfg?.branding?.contactPhone)
  )
}

export function whatsAppPrefillMessage(siteName: string): string {
  const name = siteName.trim()
  return name ? `Hi ${name}, I have a question.` : 'Hi, I have a question.'
}

export function buildWhatsAppChatUrl(digits: string, message?: string): string {
  const text = message?.trim()
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
