'use client'

import { useCallback, useMemo, useState } from 'react'
import type { PublicProduct } from '@/lib/storefront-api'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import {
  cartLineKey,
  findVariant,
  getEffectivePrice,
  isVariantInStock,
  productHasVariants,
} from '@/lib/productVariants'

export type CartEntry = {
  id: string
  name: string
  price: number
  qty: number
  variantId?: string
}

function lineName(product: PublicProduct, variantId?: string): string {
  const variant = findVariant(product, variantId)
  return variant ? `${product.name} — ${variant.name}` : product.name
}

export function useBrownButterCart() {
  const [cart, setCart] = useState<Record<string, CartEntry>>({})
  const { requireAuthForCart } = useCartAuthGate()

  const entries = useMemo(() => Object.values(cart), [cart])
  const itemCount = useMemo(() => entries.reduce((s, e) => s + e.qty, 0), [entries])
  const subtotal = useMemo(() => entries.reduce((s, e) => s + e.price * e.qty, 0), [entries])

  const setQty = useCallback(
    (product: PublicProduct, qty: number, variantId?: string) => {
      if (qty > 0 && !requireAuthForCart()) return
      if (qty > 0 && productHasVariants(product) && !variantId) return
      if (qty > 0 && !isVariantInStock(product, variantId)) return

      const key = cartLineKey(product.id, variantId)
      setCart((prev) => {
        const next = { ...prev }
        if (qty <= 0) {
          delete next[key]
          return next
        }
        next[key] = {
          id: product.id,
          name: lineName(product, variantId),
          price: getEffectivePrice(product, variantId),
          qty: Math.min(qty, 99),
          variantId,
        }
        return next
      })
    },
    [requireAuthForCart],
  )

  const add = useCallback(
    (product: PublicProduct, variantId?: string) => {
      if (!isVariantInStock(product, variantId)) return
      if (productHasVariants(product) && !variantId) return
      if (!requireAuthForCart()) return

      const key = cartLineKey(product.id, variantId)
      setCart((prev) => {
        const existing = prev[key]
        const qty = (existing?.qty ?? 0) + 1
        return {
          ...prev,
          [key]: {
            id: product.id,
            name: lineName(product, variantId),
            price: getEffectivePrice(product, variantId),
            qty: Math.min(qty, 99),
            variantId,
          },
        }
      })
    },
    [requireAuthForCart],
  )

  const clear = useCallback(() => setCart({}), [])

  const qtyFor = useCallback(
    (productId: string, variantId?: string) => cart[cartLineKey(productId, variantId)]?.qty ?? 0,
    [cart],
  )

  return { cart, entries, itemCount, subtotal, setQty, add, clear, qtyFor }
}
