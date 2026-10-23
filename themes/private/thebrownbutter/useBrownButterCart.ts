'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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

function storageKey(tenantId: string): string {
  return `bb-cart:${tenantId}`
}

function readCart(key: string): Record<string, CartEntry> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, CartEntry> = {}
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue
      const row = value as Partial<CartEntry>
      if (typeof row.id !== 'string' || typeof row.name !== 'string') continue
      if (typeof row.price !== 'number' || typeof row.qty !== 'number' || row.qty <= 0) continue
      out[id] = {
        id: row.id,
        name: row.name,
        price: row.price,
        qty: Math.min(Math.floor(row.qty), 99),
        variantId: typeof row.variantId === 'string' ? row.variantId : undefined,
      }
    }
    return out
  } catch {
    return {}
  }
}

function writeCart(key: string, cart: Record<string, CartEntry>) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(key, JSON.stringify(cart))
  } catch {
    /* private mode or a full quota — the in-memory cart still works on this page */
  }
}

export function useBrownButterCart(tenantId: string) {
  const key = storageKey(tenantId)
  const [cart, setCart] = useState<Record<string, CartEntry>>({})
  const [hydrated, setHydrated] = useState(false)
  const { requireAuthForCart } = useCartAuthGate()

  useEffect(() => {
    setCart(readCart(key))
    setHydrated(true)
  }, [key])

  useEffect(() => {
    if (!hydrated) return
    writeCart(key, cart)
  }, [cart, hydrated, key])

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

  return { cart, entries, itemCount, subtotal, setQty, add, clear, qtyFor, hydrated }
}
