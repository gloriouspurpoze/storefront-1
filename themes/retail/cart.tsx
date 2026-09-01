'use client'

import { createCartContext, cartLineProductName, type CartLineBase } from '@/theme-kit/cart'
import type { PublicProduct } from '@/lib/storefront-api'

export interface CartLine extends CartLineBase {
  slug: string
}

const { CartProvider, useCart } = createCartContext<PublicProduct, CartLine>({
  storageKeyPrefix: 'sf-cart',
  toLineExtras: (product) => ({ slug: product.slug }),
})

export { CartProvider, useCart, cartLineProductName }
export { formatMoney } from '@/lib/format'
