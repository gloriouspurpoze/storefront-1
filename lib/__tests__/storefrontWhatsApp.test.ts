import { describe, expect, it } from 'vitest'
import type { StorefrontConfig } from '../storefront-api'
import {
  buildWhatsAppChatUrl,
  normalizeWhatsAppNumber,
  resolveWhatsAppNumber,
  whatsAppPrefillMessage,
} from '../storefrontWhatsApp'

function cfg(branding: Partial<StorefrontConfig['branding']>): StorefrontConfig {
  return { branding, seo: {}, featureFlags: {} } as unknown as StorefrontConfig
}

describe('normalizeWhatsAppNumber', () => {
  it('prefixes bare Indian mobiles with 91', () => {
    expect(normalizeWhatsAppNumber('98765 43210')).toBe('919876543210')
    expect(normalizeWhatsAppNumber('098765-43210')).toBe('919876543210')
  })

  it('keeps explicit country codes', () => {
    expect(normalizeWhatsAppNumber('+91 98765 43210')).toBe('919876543210')
    expect(normalizeWhatsAppNumber('919876543210')).toBe('919876543210')
    expect(normalizeWhatsAppNumber('0091 98765 43210')).toBe('919876543210')
    expect(normalizeWhatsAppNumber('+1 (415) 555-0100')).toBe('14155550100')
    expect(normalizeWhatsAppNumber('+44 20 7946 0958')).toBe('442079460958')
  })

  it('accepts wa.me and api.whatsapp.com links', () => {
    expect(normalizeWhatsAppNumber('https://wa.me/919876543210')).toBe('919876543210')
    expect(normalizeWhatsAppNumber('https://api.whatsapp.com/send?phone=919876543210&text=hi')).toBe('919876543210')
  })

  it('rejects junk', () => {
    expect(normalizeWhatsAppNumber('')).toBeNull()
    expect(normalizeWhatsAppNumber(undefined)).toBeNull()
    expect(normalizeWhatsAppNumber('call us')).toBeNull()
    expect(normalizeWhatsAppNumber('12345')).toBeNull()
    expect(normalizeWhatsAppNumber('1234567890123456')).toBeNull()
  })
})

describe('resolveWhatsAppNumber', () => {
  it('prefers socials.whatsapp over contactPhone', () => {
    expect(
      resolveWhatsAppNumber(cfg({ socials: { whatsapp: '9000000001' }, contactPhone: '9000000002' })),
    ).toBe('919000000001')
  })

  it('falls back to contactPhone when whatsapp missing or invalid', () => {
    expect(resolveWhatsAppNumber(cfg({ contactPhone: '9000000002' }))).toBe('919000000002')
    expect(resolveWhatsAppNumber(cfg({ socials: { whatsapp: 'n/a' }, contactPhone: '9000000002' }))).toBe(
      '919000000002',
    )
  })

  it('returns null with no number', () => {
    expect(resolveWhatsAppNumber(cfg({}))).toBeNull()
    expect(resolveWhatsAppNumber(null)).toBeNull()
  })
})

describe('buildWhatsAppChatUrl', () => {
  it('encodes the prefilled message', () => {
    expect(buildWhatsAppChatUrl('919876543210', whatsAppPrefillMessage('Noze & Co'))).toBe(
      'https://wa.me/919876543210?text=Hi%20Noze%20%26%20Co%2C%20I%20have%20a%20question.',
    )
    expect(buildWhatsAppChatUrl('919876543210')).toBe('https://wa.me/919876543210')
  })
})
