import { describe, expect, it } from 'vitest'
import type { StorefrontSlider } from '../storefront-api'
import { bucketHomeCarousels, themeRendersOwnCarousels } from '../homeCarousels'

const NOW = new Date('2026-11-13T12:00:00Z')

function slide(id: string, placement: string | undefined, extra: Partial<StorefrontSlider> = {}): StorefrontSlider {
  return {
    id,
    title: id,
    image_url: `https://img.test/${id}.jpg`,
    is_active: true,
    placement,
    position: 0,
    ...extra,
  } as StorefrontSlider
}

describe('bucketHomeCarousels', () => {
  it('splits slides by placement; seasonal joins the offers strip', () => {
    const b = bucketHomeCarousels(
      [slide('h', 'home_page_hero'), slide('o', 'offers'), slide('s', 'seasonal'), slide('p', 'promo')],
      NOW,
    )
    expect(b.hero.map((s) => s.id)).toEqual(['h'])
    expect(b.offers.map((s) => s.id)).toEqual(['o', 's'])
    expect(b.promo.map((s) => s.id)).toEqual(['p'])
  })

  it('treats placement-less (legacy) slides as hero only, never duplicated', () => {
    const b = bucketHomeCarousels([slide('legacy', undefined)], NOW)
    expect(b.hero.map((s) => s.id)).toEqual(['legacy'])
    expect(b.offers).toEqual([])
    expect(b.promo).toEqual([])
  })

  it('ignores page-level and platform placements on the home page', () => {
    const b = bucketHomeCarousels(
      [slide('a', 'store_category'), slide('b', 'product_page'), slide('c', 'store_home'), slide('d', 'mobile_app_home')],
      NOW,
    )
    expect(b).toEqual({ hero: [], offers: [], promo: [] })
  })

  it('drops inactive and out-of-schedule slides', () => {
    const b = bucketHomeCarousels(
      [
        slide('off', 'offers', { is_active: false }),
        slide('future', 'offers', { start_date: '2026-12-01T00:00:00Z' }),
        slide('expired', 'offers', { end_date: '2026-11-01T00:00:00Z' }),
        slide('live', 'offers', { start_date: '2026-11-01T00:00:00Z', end_date: '2026-12-01T00:00:00Z' }),
      ],
      NOW,
    )
    expect(b.offers.map((s) => s.id)).toEqual(['live'])
  })
})

describe('themeRendersOwnCarousels', () => {
  it('skips themes that load their own carousels', () => {
    expect(themeRendersOwnCarousels('menufast-cards')).toBe(true)
    expect(themeRendersOwnCarousels('luxe-essence')).toBe(true)
    expect(themeRendersOwnCarousels('trade-pro')).toBe(false)
    expect(themeRendersOwnCarousels(undefined)).toBe(false)
  })
})
