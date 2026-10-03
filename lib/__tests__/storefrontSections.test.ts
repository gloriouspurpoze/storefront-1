import { describe, expect, it } from 'vitest'
import type { StorefrontConfig } from '../storefront-api'
import { homepageSectionOn, homepageSectionOrder } from '../storefrontSections'

const DEFAULT = ['hero', 'offers', 'products', 'promo'] as const
const cfg = (effectiveSections?: StorefrontConfig['effectiveSections']) =>
  ({ tenantId: 't', effectiveSections }) as StorefrontConfig

describe('homepageSectionOrder', () => {
  it('falls back to the theme default when the API sends nothing', () => {
    expect(homepageSectionOrder(null, DEFAULT)).toEqual([...DEFAULT])
    expect(homepageSectionOrder(cfg([]), DEFAULT)).toEqual([...DEFAULT])
  })

  it('follows server order, drops disabled and types the theme cannot render', () => {
    const c = cfg([
      { type: 'products', enabled: true },
      { type: 'hero', enabled: false },
      { type: 'faq', enabled: true },
      { type: 'promo', enabled: true },
    ])
    expect(homepageSectionOrder(c, DEFAULT)).toEqual(['products', 'promo'])
    expect(homepageSectionOn(c, DEFAULT, 'hero')).toBe(false)
    expect(homepageSectionOn(c, DEFAULT, 'promo')).toBe(true)
  })
})
