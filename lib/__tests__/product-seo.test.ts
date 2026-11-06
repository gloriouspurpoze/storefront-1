import { describe, expect, it } from 'vitest'
import { buildProductMetadata } from '../product-seo'
import type { PublicProduct } from '../storefront-api'

const product = {
  id: 'p1',
  slug: 'classic-og-nyc-cookie',
  name: 'Classic OG NYC Cookie',
  shortDescription: 'A cookie.',
  price: 199,
  currency: 'INR',
  inStock: true,
} as PublicProduct

describe('buildProductMetadata', () => {
  it('uses the product name and description when no SEO fields are set', () => {
    const meta = buildProductMetadata(product, null, 'The Brown Butter')
    expect(meta.title).toBe('Classic OG NYC Cookie')
    expect(meta.description).toBe('A cookie.')
    expect(meta.openGraph?.title).toBe('Classic OG NYC Cookie · The Brown Butter')
  })

  it('uses the merchant SEO title and description, adding the brand once', () => {
    const meta = buildProductMetadata(
      { ...product, seoTitle: 'Thick NYC Cookie | 100% Pure Veg', seoDescription: 'Slow-baked.' },
      null,
      'The Brown Butter',
    )
    expect(meta.title).toBe('Thick NYC Cookie | 100% Pure Veg')
    expect(meta.description).toBe('Slow-baked.')
    expect(meta.openGraph?.title).toBe('Thick NYC Cookie | 100% Pure Veg · The Brown Butter')
    const branded = buildProductMetadata({ ...product, seoTitle: 'NYC Cookie | The Brown Butter' }, null, 'The Brown Butter')
    expect(branded.title).toEqual({ absolute: 'NYC Cookie | The Brown Butter' })
  })
})
