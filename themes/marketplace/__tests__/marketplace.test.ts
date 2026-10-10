import { describe, expect, it } from 'vitest'
import { catalogHref, parseCatalogQuery, priceBands } from '../catalogQuery'
import { groupLinesBySeller, type MarketplaceCartLine } from '../cartGroups'
import { listingQueryString, normalizeListing } from '@/lib/marketplace-api'
import { themeSectionDefaults } from '@/lib/storefrontSections'

describe('parseCatalogQuery', () => {
  it('keeps valid values and drops junk', () => {
    expect(
      parseCatalogQuery({ q: '  mugs ', category: 'Home-Decor', minPrice: '200', maxPrice: '-5', sort: 'price_asc', page: '2' }),
    ).toEqual({ q: 'mugs', category: 'home-decor', minPrice: 200, maxPrice: undefined, sort: 'price_asc', page: 2 })
    expect(parseCatalogQuery({ sort: 'evil', page: 'abc' })).toEqual({
      q: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sort: undefined,
      page: undefined,
    })
  })
})

describe('catalogHref', () => {
  it('resets the page when a filter changes and drops default sort', () => {
    const current = { q: 'mug', page: 3, sort: 'newest' as const }
    expect(catalogHref('/search', current, { category: 'ceramics' })).toBe('/search?q=mug&category=ceramics&sort=newest')
    expect(catalogHref('/search', current, { sort: 'relevance' })).toBe('/search?q=mug')
  })

  it('keeps the page only when paging', () => {
    expect(catalogHref('/products', { category: 'gifts' }, { page: 2 })).toBe('/products?category=gifts&page=2')
    expect(catalogHref('/products', {}, { page: 1 })).toBe('/products')
  })
})

describe('priceBands', () => {
  it('builds four open-ended bands across the range', () => {
    const bands = priceBands({ min: 0, max: 4000 })
    expect(bands).toHaveLength(4)
    expect(bands[0].min).toBeUndefined()
    expect(bands[3].max).toBeUndefined()
  })

  it('returns nothing for a narrow range', () => {
    expect(priceBands({ min: 100, max: 150 })).toEqual([])
  })
})

describe('groupLinesBySeller', () => {
  const line = (id: string, seller: string, price: number, quantity: number): MarketplaceCartLine => ({
    productId: id,
    name: id,
    price,
    currency: 'INR',
    quantity,
    sellerSlug: seller,
    sellerName: seller.toUpperCase(),
  })

  it('groups by seller in first-added order with subtotals', () => {
    const groups = groupLinesBySeller([line('a', 'raj', 100, 2), line('b', 'meera', 50, 1), line('c', 'raj', 10, 3)])
    expect(groups.map((g) => g.sellerSlug)).toEqual(['raj', 'meera'])
    expect(groups[0].subtotal).toBe(230)
    expect(groups[0].lines.map((l) => l.productId)).toEqual(['a', 'c'])
  })
})

describe('marketplace API helpers', () => {
  it('builds the search query string with product-only defaults applied by callers', () => {
    expect(listingQueryString({ q: 'vase', category: 'decor', sort: 'relevance', page: 1, types: ['product'], facets: true })).toBe(
      'q=vase&category=decor&types=product&facets=1',
    )
  })

  it('normalizes a populated listing into a card', () => {
    const card = normalizeListing({
      _id: 'l1',
      title: 'Blue vase',
      listingType: 'product',
      priceInr: 900,
      compareAtPriceInr: 1200,
      productDetails: { images: ['', 'https://img/1.jpg'], stockQty: 0, productId: { slug: 'blue-vase' } },
      sellerId: { slug: 'raj', displayName: 'Raj Crafts', rating: 4.5, reviewCount: 12 },
    })
    expect(card).toMatchObject({
      listingId: 'l1',
      productSlug: 'blue-vase',
      compareAtPriceInr: 1200,
      imageUrl: 'https://img/1.jpg',
      inStock: false,
      seller: { slug: 'raj', name: 'Raj Crafts', rating: 4.5, reviewCount: 12 },
    })
  })
})

describe('marketplace sections', () => {
  it('has a designed order for both the layout theme and the classic fallback', () => {
    expect(themeSectionDefaults('marketplace-classic', 'marketplace')).toContain('featuredSellers')
    expect(themeSectionDefaults(undefined, 'marketplace')).toContain('sellCta')
  })
})
