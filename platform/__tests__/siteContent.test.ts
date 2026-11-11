import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HOME_CONTENT,
  MARKETING_VERTICALS,
  launchOfferLive,
  marketingPlanCatalog,
  marketingPlansForVertical,
  resolvePlatformSiteContent,
} from '@profixer/marketing-data'

describe('resolvePlatformSiteContent — defaults', () => {
  it('returns the built-in content when admin has saved nothing', () => {
    const site = resolvePlatformSiteContent()
    expect(site.verticals).toHaveLength(MARKETING_VERTICALS.length)
    expect(site.plans('salon')).toEqual(marketingPlansForVertical('salon'))
    expect(site.home).toEqual(DEFAULT_HOME_CONTENT)
    expect(site.launchOffer?.label).toBe('Launch offer')
  })

  it('ignores garbage from the API instead of throwing', () => {
    const site = resolvePlatformSiteContent({ pricing: 'x', industries: [1, 2], home: null })
    expect(site.verticals).toHaveLength(MARKETING_VERTICALS.length)
    expect(site.home.features).toEqual(DEFAULT_HOME_CONTENT.features)
  })
})

describe('pricing overrides', () => {
  it('applies price, label and recommended to every industry sharing the plan', () => {
    const site = resolvePlatformSiteContent({
      pricing: { plans: { hs_starter: { priceMonthlyInr: 699, label: 'Solo', recommended: false } } },
    })
    for (const key of ['home_services', 'fitness', 'education'] as const) {
      const starter = site.plans(key).find((p) => p.key === 'hs_starter')!
      expect(starter).toMatchObject({ priceMonthlyInr: 699, label: 'Solo', recommended: false })
    }
  })

  it('hides a plan, clears a compare-at price with null, and rejects bad prices', () => {
    const site = resolvePlatformSiteContent({
      pricing: { plans: { hs_scale: { hidden: true }, hs_growth: { compareAtMonthlyInr: null, priceMonthlyInr: -5 } } },
    })
    const plans = site.plans('home_services')
    expect(plans.map((p) => p.key)).toEqual(['hs_starter', 'hs_growth'])
    expect(plans[1].compareAtMonthlyInr).toBeUndefined()
    expect(plans[1].priceMonthlyInr).toBe(999)
  })

  it('switches the launch offer off, or keeps a valid custom deadline', () => {
    expect(resolvePlatformSiteContent({ pricing: { launchOffer: { enabled: false } } }).launchOffer).toBeNull()
    const offer = resolvePlatformSiteContent({ pricing: { launchOffer: { endsAt: '2030-01-01T00:00:00+05:30', headline: '30% off' } } }).launchOffer
    expect(offer).toMatchObject({ endsAt: '2030-01-01T00:00:00+05:30', headline: '30% off' })
    expect(launchOfferLive(offer, Date.parse('2029-12-31'))).toBe(true)
    expect(launchOfferLive(offer, Date.parse('2030-02-01'))).toBe(false)
    expect(launchOfferLive(null)).toBe(false)
  })
})

describe('industry overrides', () => {
  it('hides an industry from the list and from slug lookup', () => {
    const site = resolvePlatformSiteContent({ industries: { healthcare: { hidden: true } } })
    expect(site.verticals.map((v) => v.key)).not.toContain('healthcare')
    expect(site.verticalBySlug('for-healthcare')).toBeNull()
    expect(site.isVisible('healthcare')).toBe(false)
    expect(site.verticalBySlug('for-salons')?.key).toBe('salon')
  })

  it('rewrites copy but keeps the URL slug and the card icons', () => {
    const site = resolvePlatformSiteContent({
      industries: { salon: { label: 'Salons', title: 'New hero', pains: [{ title: 'P1', body: 'B1' }] } },
    })
    expect(site.vertical('salon')).toMatchObject({ label: 'Salons', marketingSlug: 'for-salons' })
    const landing = site.landing('salon')
    expect(landing.title).toBe('New hero')
    expect(landing.pains).toHaveLength(1)
    expect(landing.pains[0].icon).toBeTruthy()
  })

  it('treats an empty card list as "use the default" so a section never goes blank', () => {
    const base = resolvePlatformSiteContent().landing('salon')
    expect(resolvePlatformSiteContent({ industries: { salon: { pains: [] } } }).landing('salon').pains).toEqual(base.pains)
  })
})

describe('home overrides', () => {
  it('replaces feature cards and falls back to a default icon for unknown keys', () => {
    const site = resolvePlatformSiteContent({
      home: { features: [{ icon: 'not-an-icon', title: 'A', body: 'B' }, { icon: 'zap', title: 'C', body: 'D' }] },
    })
    expect(site.home.features).toEqual([
      { icon: DEFAULT_HOME_CONTENT.features[0].icon, title: 'A', body: 'B' },
      { icon: 'zap', title: 'C', body: 'D' },
    ])
    expect(site.home.steps).toEqual(DEFAULT_HOME_CONTENT.steps)
  })
})

describe('marketingPlanCatalog', () => {
  it('lists each shared plan once with every industry that sells it', () => {
    const starter = marketingPlanCatalog().find((r) => r.plan.key === 'hs_starter')!
    expect(starter.verticals).toEqual(expect.arrayContaining(['home_services', 'fitness', 'healthcare']))
    expect(marketingPlanCatalog().filter((r) => r.plan.key === 'hs_starter')).toHaveLength(1)
  })
})
