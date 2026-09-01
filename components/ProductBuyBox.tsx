'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PublicProduct } from '@/lib/storefront-api'
import { formatMoney } from '@/lib/format'
import {
  getDefaultVariant,
  getEffectiveOriginalPrice,
  getEffectivePrice,
  isVariantInStock,
  productHasVariants,
} from '@/lib/productVariants'
import { ProductVariantSelector, type VariantSelectorTone } from '@/components/ProductVariantSelector'
import { useCart } from '@/themes/retail/cart'

export function ProductBuyBox({
  product,
  tone = 'default',
}: {
  product: PublicProduct
  tone?: VariantSelectorTone
}) {
  const { addItem } = useCart()
  const hasVariants = productHasVariants(product)
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product])
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(defaultVariant?.id ?? null)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setSelectedVariantId(defaultVariant?.id ?? null)
  }, [product.id, defaultVariant?.id])

  const price = getEffectivePrice(product, selectedVariantId)
  const originalPrice = getEffectiveOriginalPrice(product, selectedVariantId)
  const inStock = isVariantInStock(product, selectedVariantId)
  const needsSelection = hasVariants && !selectedVariantId

  const handleAdd = () => {
    if (!inStock || needsSelection) return
    addItem(product, 1, selectedVariantId ?? undefined)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold">{formatMoney(price, product.currency)}</span>
        {originalPrice ? (
          <span className="text-lg opacity-60 line-through">
            {formatMoney(originalPrice, product.currency)}
          </span>
        ) : null}
      </div>

      {hasVariants ? (
        <ProductVariantSelector
          variants={product.variants!}
          selectedId={selectedVariantId}
          onSelect={setSelectedVariantId}
          tone={tone}
        />
      ) : null}

      <div className="mt-8 max-w-sm">
        {!inStock ? (
          <button
            type="button"
            disabled
            className="w-full rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500"
          >
            Out of stock
          </button>
        ) : needsSelection ? (
          <button
            type="button"
            disabled
            className="w-full rounded-full bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-500"
          >
            Select an option
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            className="w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--site-brand)' }}
          >
            {added ? 'Added to cart' : 'Add to cart'}
          </button>
        )}
      </div>
    </div>
  )
}
