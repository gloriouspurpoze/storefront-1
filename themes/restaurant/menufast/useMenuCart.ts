'use client'

import { useCallback, useMemo, useState } from 'react'
import type { PublicMenuItem } from '@/lib/storefront-api'
import { isMenuItemInStock } from '@/lib/storefront-api'

export type CartMap = Record<string, number>

export function useMenuCart(categories: { items: PublicMenuItem[] }[]) {
  const [cart, setCart] = useState<CartMap>({})

  const itemById = useMemo(() => {
    const map = new Map<string, PublicMenuItem>()
    for (const cat of categories) {
      for (const item of cat.items) map.set(item.id, item)
    }
    return map
  }, [categories])

  const addItem = useCallback((item: PublicMenuItem) => {
    if (!isMenuItemInStock(item)) return
    setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }))
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => {
      const next = { ...prev }
      const qty = (next[itemId] ?? 0) - 1
      if (qty <= 0) delete next[itemId]
      else next[itemId] = qty
      return next
    })
  }, [])

  const clearCart = useCallback(() => setCart({}), [])

  const entries = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const item = itemById.get(id)
          return item ? { item, quantity } : null
        })
        .filter(Boolean) as { item: PublicMenuItem; quantity: number }[],
    [cart, itemById],
  )

  const itemCount = entries.reduce((sum, e) => sum + e.quantity, 0)
  const subtotal = entries.reduce((sum, e) => sum + e.item.price * e.quantity, 0)

  return { cart, entries, itemCount, subtotal, addItem, removeItem, clearCart, qtyFor: (id: string) => cart[id] ?? 0 }
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
  entries: { item: PublicMenuItem; quantity: number }[],
): string | null {
  if (!phone || entries.length === 0) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const lines = entries.map(
    (e) => `${e.quantity}× ${e.item.name} — ${formatMenuPrice(e.item.price * e.quantity, e.item.currency)}`,
  )
  const text = `Hi! I'd like to order from ${siteName}:\n\n${lines.join('\n')}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
