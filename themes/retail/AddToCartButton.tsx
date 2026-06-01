'use client'

import { useState } from 'react'
import type { PublicProduct } from '@/lib/storefront-api'
import { useCart } from './cart'

export function AddToCartButton({ product }: { product: PublicProduct }) {
  const { addProduct } = useCart()
  const [added, setAdded] = useState(false)

  if (!product.inStock) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500"
      >
        Out of stock
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        addProduct(product, 1)
        setAdded(true)
        window.setTimeout(() => setAdded(false), 2000)
      }}
      className="w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      style={{ backgroundColor: 'var(--site-brand)' }}
    >
      {added ? 'Added to cart' : 'Add to cart'}
    </button>
  )
}
