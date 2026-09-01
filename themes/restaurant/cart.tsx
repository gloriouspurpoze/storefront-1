'use client'

import { createCartContext, cartLineProductName, type CartLineBase } from '@/theme-kit/cart'
import type { PublicMenuItem } from '@/lib/storefront-api'

export type CartLine = CartLineBase

const { CartProvider, useCart } = createCartContext<PublicMenuItem, CartLine>({
  storageKeyPrefix: 'sf-restaurant-cart',
})

export { CartProvider, useCart, cartLineProductName }
export { formatMoney } from '@/lib/format'
