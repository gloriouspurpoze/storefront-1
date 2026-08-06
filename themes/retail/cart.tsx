'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PublicProduct } from '@/lib/storefront-api'
import {
  cartLineKey,
  findVariant,
  getEffectivePrice,
  isVariantInStock,
  productHasVariants,
} from '@/lib/productVariants'

export interface CartLine {
  productId: string
  variantId?: string
  variantName?: string
  slug: string
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
  addProduct: (product: PublicProduct, quantity?: number, variantId?: string) => void
  setQuantity: (productId: string, quantity: number, variantId?: string) => void
  removeLine: (productId: string, variantId?: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function storageKey(tenantId: string): string {
  return `sf-cart:${tenantId}`
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

function lineDisplayName(product: PublicProduct, variantId?: string): string {
  const variant = findVariant(product, variantId)
  return variant ? `${product.name} — ${variant.name}` : product.name
}

/** Product title without the “ — variant” suffix when an option chip is shown. */
export function cartLineProductName(line: CartLine): string {
  if (!line.variantName) return line.name
  const suffix = ` — ${line.variantName}`
  return line.name.endsWith(suffix) ? line.name.slice(0, -suffix.length) : line.name
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

  const addProduct = useCallback(
    (product: PublicProduct, quantity = 1, variantId?: string) => {
      if (!isVariantInStock(product, variantId)) return
      if (productHasVariants(product) && !variantId) return
      const qty = Math.min(Math.max(Math.floor(quantity), 1), 99)
      const key = cartLineKey(product.id, variantId)
      const variant = findVariant(product, variantId)
      setLines((prev) => {
        const existing = prev.find((l) => cartLineKey(l.productId, l.variantId) === key)
        const next = existing
          ? prev.map((l) =>
              cartLineKey(l.productId, l.variantId) === key
                ? { ...l, quantity: Math.min(l.quantity + qty, 99) }
                : l,
            )
          : [
              ...prev,
              {
                productId: product.id,
                variantId,
                variantName: variant?.name,
                slug: product.slug,
                name: lineDisplayName(product, variantId),
                price: getEffectivePrice(product, variantId),
                currency: product.currency,
                imageUrl: product.imageUrl,
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

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  )
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines],
  )

  const value = useMemo(
    () => ({
      lines,
      itemCount,
      subtotal,
      addProduct,
      setQuantity,
      removeLine,
      clear,
    }),
    [lines, itemCount, subtotal, addProduct, setQuantity, removeLine, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export { formatMoney } from '@/lib/format'
