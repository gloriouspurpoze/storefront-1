'use client'

import { useCallback, useMemo, useState } from 'react'
import type { PublicMenuItem } from '@/lib/storefront-api'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import {
  cartLineKey,
  findVariant,
  getEffectivePrice,
  isVariantInStock,
  productHasVariants,
} from '@/lib/productVariants'

export type CartMap = Record<string, number>

export type MenuCartEntry = {
  item: PublicMenuItem
  quantity: number
  variantId?: string
}

/** @deprecated Use MenuCartEntry */
export type CartEntry = MenuCartEntry

function parseCartKey(key: string): { productId: string; variantId?: string } {
  const colon = key.indexOf(':')
  if (colon === -1) return { productId: key }
  return { productId: key.slice(0, colon), variantId: key.slice(colon + 1) }
}

export function menuCartLineLabel(item: PublicMenuItem, variantId?: string): string {
  const variant = findVariant(item, variantId)
  return variant ? `${item.name} — ${variant.name}` : item.name
}

export function useMenuCart(categories: { items: PublicMenuItem[] }[]) {
  const [cart, setCart] = useState<CartMap>({})
  const { requireAuthForCart, isReady } = useCartAuthGate()

  const itemById = useMemo(() => {
    const map = new Map<string, PublicMenuItem>()
    for (const cat of categories) {
      for (const item of cat.items) map.set(item.id, item)
    }
    return map
  }, [categories])

  const addItem = useCallback(
    (item: PublicMenuItem, variantId?: string) => {
      if (!isVariantInStock(item, variantId)) return
      if (productHasVariants(item) && !variantId) return
      if (!requireAuthForCart()) return
      const key = cartLineKey(item.id, variantId)
      setCart((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }))
    },
    [requireAuthForCart],
  )

  const removeItem = useCallback((itemId: string, variantId?: string) => {
    const key = cartLineKey(itemId, variantId)
    setCart((prev) => {
      const next = { ...prev }
      const qty = (next[key] ?? 0) - 1
      if (qty <= 0) delete next[key]
      else next[key] = qty
      return next
    })
  }, [])

  const clearCart = useCallback(() => setCart({}), [])

  const entries = useMemo(
    () =>
      Object.entries(cart)
        .map(([key, quantity]) => {
          const { productId, variantId } = parseCartKey(key)
          const item = itemById.get(productId)
          return item ? ({ item, quantity, variantId } satisfies MenuCartEntry) : null
        })
        .filter(Boolean) as MenuCartEntry[],
    [cart, itemById],
  )

  const itemCount = entries.reduce((sum, e) => sum + e.quantity, 0)
  const subtotal = entries.reduce(
    (sum, e) => sum + getEffectivePrice(e.item, e.variantId) * e.quantity,
    0,
  )

  const qtyFor = useCallback(
    (itemId: string, variantId?: string) => cart[cartLineKey(itemId, variantId)] ?? 0,
    [cart],
  )

  return { cart, entries, itemCount, subtotal, addItem, removeItem, clearCart, qtyFor, authReady: isReady }
}

export function formatMenuPrice(price: number, currency = 'INR'): string {
  return currency === 'INR' ? `₹${price.toLocaleString('en-IN')}` : `${currency} ${price}`
}

export function isVegItem(item: PublicMenuItem): boolean {
  return (item.dietary ?? []).some((d) => d.toLowerCase() === 'veg' || d.toLowerCase() === 'vegetarian')
}

export function buildWhatsAppOrderUrl(
  phone: string | undefined,
  siteName: string,
  entries: MenuCartEntry[],
): string | null {
  if (!phone || entries.length === 0) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const lines = entries.map((e) => {
    const unitPrice = getEffectivePrice(e.item, e.variantId)
    const label = menuCartLineLabel(e.item, e.variantId)
    return `${e.quantity}× ${label} — ${formatMenuPrice(unitPrice * e.quantity, e.item.currency)}`
  })
  const text = `Hi! I'd like to order from ${siteName}:\n\n${lines.join('\n')}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
