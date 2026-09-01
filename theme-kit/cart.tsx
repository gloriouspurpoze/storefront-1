'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { VariantCarrier } from '@/lib/productVariants'
import {
  cartLineKey,
  findVariant,
  getEffectiveImageUrl,
  getEffectivePrice,
  isVariantInStock,
  productHasVariants,
} from '@/lib/productVariants'

export interface CartLineBase {
  productId: string
  variantId?: string
  variantName?: string
  name: string
  price: number
  currency: string
  imageUrl?: string
  quantity: number
}

type CartItem = VariantCarrier & {
  id: string
  name: string
  currency: string
  imageUrl?: string
}

export interface CartConfig<TItem extends CartItem, TLine extends CartLineBase> {
  /** localStorage key becomes `{storageKeyPrefix}:{tenantId}`. */
  storageKeyPrefix: string
  /** Extra per-line fields derived from the source item (e.g. retail's `slug`). */
  toLineExtras?: (item: TItem) => Omit<TLine, keyof CartLineBase>
}

export interface CartContextValue<TItem extends CartItem, TLine extends CartLineBase> {
  lines: TLine[]
  itemCount: number
  subtotal: number
  addItem: (item: TItem, quantity?: number, variantId?: string) => void
  setQuantity: (productId: string, quantity: number, variantId?: string) => void
  removeLine: (productId: string, variantId?: string) => void
  clear: () => void
}

/** Product title without the “ — variant” suffix when an option chip is shown. */
export function cartLineProductName(line: Pick<CartLineBase, 'name' | 'variantName'>): string {
  if (!line.variantName) return line.name
  const suffix = ` — ${line.variantName}`
  return line.name.endsWith(suffix) ? line.name.slice(0, -suffix.length) : line.name
}

function lineDisplayName(item: CartItem, variantId?: string): string {
  const variant = findVariant(item, variantId)
  return variant ? `${item.name} — ${variant.name}` : item.name
}

/**
 * Builds a tenant-scoped, localStorage-backed cart `CartProvider`/`useCart` pair.
 * Shared body for every `themes/{vertical}/cart.tsx` — verticals differ only in
 * item type, storage-key prefix, and any extra per-line fields (e.g. retail's `slug`).
 */
export function createCartContext<TItem extends CartItem, TLine extends CartLineBase = CartLineBase>(
  config: CartConfig<TItem, TLine>,
) {
  const CartContext = createContext<CartContextValue<TItem, TLine> | null>(null)

  function storageKey(tenantId: string): string {
    return `${config.storageKeyPrefix}:${tenantId}`
  }

  function readCart(tenantId: string): TLine[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(storageKey(tenantId))
      if (!raw) return []
      const parsed = JSON.parse(raw) as TLine[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function writeCart(tenantId: string, lines: TLine[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(storageKey(tenantId), JSON.stringify(lines))
  }

  function toLine(item: TItem, variantId: string | undefined, quantity: number): TLine {
    const variant = findVariant(item, variantId)
    const extras = config.toLineExtras?.(item) ?? ({} as Omit<TLine, keyof CartLineBase>)
    return {
      ...extras,
      productId: item.id,
      variantId,
      variantName: variant?.name,
      name: lineDisplayName(item, variantId),
      price: getEffectivePrice(item, variantId),
      currency: item.currency,
      imageUrl: getEffectiveImageUrl(item, variantId),
      quantity,
    } as TLine
  }

  function CartProvider({ tenantId, children }: { tenantId: string; children: ReactNode }) {
    const [lines, setLines] = useState<TLine[]>([])

    useEffect(() => {
      setLines(readCart(tenantId))
    }, [tenantId])

    const persist = useCallback(
      (next: TLine[]) => {
        setLines(next)
        writeCart(tenantId, next)
      },
      [tenantId],
    )

    const addItem = useCallback(
      (item: TItem, quantity = 1, variantId?: string) => {
        if (!isVariantInStock(item, variantId)) return
        if (productHasVariants(item) && !variantId) return
        const qty = Math.min(Math.max(Math.floor(quantity), 1), 99)
        const key = cartLineKey(item.id, variantId)
        setLines((prev) => {
          const existing = prev.find((l) => cartLineKey(l.productId, l.variantId) === key)
          const next = existing
            ? prev.map((l) =>
                cartLineKey(l.productId, l.variantId) === key
                  ? { ...l, quantity: Math.min(l.quantity + qty, 99) }
                  : l,
              )
            : [...prev, toLine(item, variantId, qty)]
          writeCart(tenantId, next)
          return next
        })
      },
      [tenantId],
    )

    const setQuantity = useCallback(
      (productId: string, quantity: number, variantId?: string) => {
        const key = cartLineKey(productId, variantId)
        const qty = Math.floor(quantity)
        setLines((prev) => {
          const next =
            qty <= 0
              ? prev.filter((l) => cartLineKey(l.productId, l.variantId) !== key)
              : prev.map((l) =>
                  cartLineKey(l.productId, l.variantId) === key
                    ? { ...l, quantity: Math.min(qty, 99) }
                    : l,
                )
          writeCart(tenantId, next)
          return next
        })
      },
      [tenantId],
    )

    const removeLine = useCallback(
      (productId: string, variantId?: string) => {
        const key = cartLineKey(productId, variantId)
        setLines((prev) => {
          const next = prev.filter((l) => cartLineKey(l.productId, l.variantId) !== key)
          writeCart(tenantId, next)
          return next
        })
      },
      [tenantId],
    )

    const clear = useCallback(() => persist([]), [persist])

    const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines])
    const subtotal = useMemo(
      () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      [lines],
    )

    const value = useMemo(
      () => ({ lines, itemCount, subtotal, addItem, setQuantity, removeLine, clear }),
      [lines, itemCount, subtotal, addItem, setQuantity, removeLine, clear],
    )

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
  }

  function useCart(): CartContextValue<TItem, TLine> {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error('useCart must be used within CartProvider')
    return ctx
  }

  return { CartProvider, useCart }
}

export { formatMoney } from '@/lib/format'
