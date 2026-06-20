'use client'

import { useCallback, useMemo, useState } from 'react'
import type { PublicProduct } from '@/lib/storefront-api'

export type CartEntry = { id: string; name: string; price: number; qty: number }

export function useBrownButterCart() {
  const [cart, setCart] = useState<Record<string, CartEntry>>({})

  const entries = useMemo(() => Object.values(cart), [cart])
  const itemCount = useMemo(() => entries.reduce((s, e) => s + e.qty, 0), [entries])
  const subtotal = useMemo(() => entries.reduce((s, e) => s + e.price * e.qty, 0), [entries])

  const setQty = useCallback((product: PublicProduct, qty: number) => {
    setCart((prev) => {
      const next = { ...prev }
      if (qty <= 0) {
        delete next[product.id]
        return next
      }
      next[product.id] = {
        id: product.id,
        name: product.name,
        price: product.price,
        qty: Math.min(qty, 99),
      }
      return next
    })
  }, [])

  const add = useCallback((product: PublicProduct) => {
    setCart((prev) => {
      const existing = prev[product.id]
      const qty = (existing?.qty ?? 0) + 1
      return {
        ...prev,
        [product.id]: {
          id: product.id,
          name: product.name,
          price: product.price,
          qty,
        },
      }
    })
  }, [])

  const clear = useCallback(() => setCart({}), [])

  const qtyFor = useCallback((productId: string) => cart[productId]?.qty ?? 0, [cart])

  return { cart, entries, itemCount, subtotal, setQty, add, clear, qtyFor }
}
