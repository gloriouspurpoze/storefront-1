'use client'

import { useState } from 'react'
import type { PublicMenuItem } from '@/lib/storefront-api'
import { isMenuItemInStock } from '@/lib/storefront-api'
import { useCart } from './cart'

export function MenuAddToCartButton({ item }: { item: PublicMenuItem }) {
  const { addMenuItem, lines } = useCart()
  const [flash, setFlash] = useState(false)
  const qty = lines.find((l) => l.productId === item.id)?.quantity ?? 0
  const inStock = isMenuItemInStock(item)

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <p className="text-sm font-semibold text-stone-800">
        {item.currency === 'INR' ? `₹${item.price.toLocaleString('en-IN')}` : `${item.currency} ${item.price}`}
      </p>
      {!inStock ? (
        <span className="text-xs font-medium uppercase tracking-wide text-amber-700">Out of stock</span>
      ) : qty === 0 ? (
        <button
          type="button"
          onClick={() => {
            addMenuItem(item, 1)
            setFlash(true)
            window.setTimeout(() => setFlash(false), 1500)
          }}
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
          style={{ backgroundColor: 'var(--site-brand)' }}
        >
          {flash ? 'Added' : 'Add'}
        </button>
      ) : (
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
          {qty} in cart
        </span>
      )}
    </div>
  )
}
