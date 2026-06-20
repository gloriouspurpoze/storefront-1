'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PublicMenuItem } from '@/lib/storefront-api'
import { isMenuItemInStock } from '@/lib/storefront-api'

export interface CartLine {
  productId: string
  name: string
  price: number
  currency: string
  imageUrl?: string
  quantity: number
}

interface CartContextValue {
  lines: CartLine[]
  itemCount: number
  subtotal: number
  addMenuItem: (item: PublicMenuItem, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeLine: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function storageKey(tenantId: string): string {
  return `sf-restaurant-cart:${tenantId}`
}

function readCart(tenantId: string): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(tenantId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCart(tenantId: string, lines: CartLine[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(storageKey(tenantId), JSON.stringify(lines))
}

export function CartProvider({
  tenantId,
  children,
}: {
  tenantId: string
  children: React.ReactNode
}) {
  const [lines, setLines] = useState<CartLine[]>([])

  useEffect(() => {
    setLines(readCart(tenantId))
  }, [tenantId])

  const persist = useCallback(
    (next: CartLine[]) => {
      setLines(next)
      writeCart(tenantId, next)
    },
    [tenantId],
  )

  const addMenuItem = useCallback(
    (item: PublicMenuItem, quantity = 1) => {
      if (!isMenuItemInStock(item)) return
      const qty = Math.min(Math.max(Math.floor(quantity), 1), 99)
      setLines((prev) => {
        const existing = prev.find((l) => l.productId === item.id)
        const next = existing
          ? prev.map((l) =>
              l.productId === item.id
                ? { ...l, quantity: Math.min(l.quantity + qty, 99) }
                : l,
            )
          : [
              ...prev,
              {
                productId: item.id,
                name: item.name,
                price: item.price,
                currency: item.currency,
                imageUrl: item.imageUrl,
                quantity: qty,
              },
            ]
        writeCart(tenantId, next)
        return next
      })
    },
    [tenantId],
  )

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const qty = Math.floor(quantity)
      setLines((prev) => {
        const next =
          qty <= 0
            ? prev.filter((l) => l.productId !== productId)
            : prev.map((l) =>
                l.productId === productId ? { ...l, quantity: Math.min(qty, 99) } : l,
              )
        writeCart(tenantId, next)
        return next
      })
    },
    [tenantId],
  )

  const removeLine = useCallback(
    (productId: string) => {
      setLines((prev) => {
        const next = prev.filter((l) => l.productId !== productId)
        writeCart(tenantId, next)
        return next
      })
    },
    [tenantId],
  )

  const clear = useCallback(() => persist([]), [persist])

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines])
  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.quantity, 0), [lines])

  const value = useMemo(
    () => ({ lines, itemCount, subtotal, addMenuItem, setQuantity, removeLine, clear }),
    [lines, itemCount, subtotal, addMenuItem, setQuantity, removeLine, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export { formatMoney } from '@/lib/format'
