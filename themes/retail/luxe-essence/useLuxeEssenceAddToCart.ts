'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PublicProduct } from '@/lib/storefront-api'
import {
  cartLineKey,
  findVariant,
  isVariantInStock,
  productHasVariants,
} from '@/lib/productVariants'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import { useCart } from '../cart'

export function useLuxeEssenceAddToCart() {
  const { addProduct, setQuantity, removeLine, lines } = useCart()
  const { requireAuthForCart, isReady } = useCartAuthGate()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const qtyFor = useCallback(
    (productId: string, variantId?: string) => {
      const key = cartLineKey(productId, variantId)
      return lines.find((l) => cartLineKey(l.productId, l.variantId) === key)?.quantity ?? 0
    },
    [lines],
  )

  const totalQtyForProduct = useCallback(
    (productId: string) =>
      lines.filter((l) => l.productId === productId).reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  )

  const showAddedToast = useCallback((product: PublicProduct, variantId?: string) => {
    const variant = findVariant(product, variantId)
    setToast(variant ? `${product.name} — ${variant.name} added to cart` : `${product.name} added to cart`)
  }, [])

  const addToCart = useCallback(
    (product: PublicProduct, variantId?: string) => {
      if (!isVariantInStock(product, variantId)) return
      if (productHasVariants(product) && !variantId) return
      if (!requireAuthForCart()) return
      addProduct(product, 1, variantId)
      showAddedToast(product, variantId)
    },
    [addProduct, requireAuthForCart, showAddedToast],
  )

  const removeFromCart = useCallback(
    (productId: string, variantId?: string) => {
      const qty = qtyFor(productId, variantId)
      if (qty <= 1) removeLine(productId, variantId)
      else setQuantity(productId, qty - 1, variantId)
    },
    [qtyFor, removeLine, setQuantity],
  )

  return {
    addToCart,
    removeFromCart,
    qtyFor,
    totalQtyForProduct,
    authReady: isReady,
    toast,
  }
}
