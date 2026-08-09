import { resolveGalleryUrlsForVariant } from '../storefront-api'
import { getEffectiveImageUrl } from '../productVariants'
import type { PublicProduct } from '../storefront-api'

const base: PublicProduct = {
  id: 'p1',
  slug: 'tee',
  name: 'Tee',
  price: 499,
  currency: 'INR',
  imageUrl: 'https://cdn.example.com/product.jpg',
  imageUrls: ['https://cdn.example.com/product.jpg', 'https://cdn.example.com/alt.jpg'],
  inStock: true,
  hasVariants: true,
  variants: [
    {
      id: 'v-red',
      name: 'Red',
      price: 499,
      imageUrl: 'https://cdn.example.com/red.jpg',
    },
    { id: 'v-blue', name: 'Blue', price: 519 },
  ],
}

describe('variant images', () => {
  it('prefers variant imageUrl for effective display', () => {
    expect(getEffectiveImageUrl(base, 'v-red')).toBe('https://cdn.example.com/red.jpg')
    expect(getEffectiveImageUrl(base, 'v-blue')).toBe('https://cdn.example.com/product.jpg')
    expect(getEffectiveImageUrl(base, null)).toBe('https://cdn.example.com/product.jpg')
  })

  it('leads gallery with variant photo then product gallery', () => {
    expect(resolveGalleryUrlsForVariant(base, 'v-red')).toEqual([
      'https://cdn.example.com/red.jpg',
      'https://cdn.example.com/product.jpg',
      'https://cdn.example.com/alt.jpg',
    ])
    expect(resolveGalleryUrlsForVariant(base, 'v-blue')).toEqual([
      'https://cdn.example.com/product.jpg',
      'https://cdn.example.com/alt.jpg',
    ])
  })
})
