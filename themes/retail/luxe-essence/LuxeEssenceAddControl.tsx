'use client'

import type { PublicProduct } from '@/lib/storefront-api'
import { isVariantInStock, productHasVariants } from '@/lib/productVariants'

export function LuxeEssenceAddControl({
  product,
  authReady,
  variantQty = 0,
  onAdd,
  onSelectOptions,
}: {
  product: PublicProduct
  authReady: boolean
  variantQty?: number
  onAdd: (product: PublicProduct) => void
  onSelectOptions?: (product: PublicProduct) => void
}) {
  const hasVariants = productHasVariants(product)
  const inStock = isVariantInStock(product)

  if (!inStock) {
    return (
      <button type="button" className="le-add-to-cart" disabled aria-disabled="true">
        Out of stock
      </button>
    )
  }

  if (hasVariants) {
    return (
      <button
        type="button"
        className={`le-add-to-cart${variantQty > 0 ? ' le-add-to-cart--has-qty' : ''}`}
        disabled={!authReady}
        aria-label={`Choose options for ${product.name}${variantQty > 0 ? `, ${variantQty} in cart` : ''}`}
        onClick={() => onSelectOptions?.(product)}
      >
        {variantQty > 0 ? `${variantQty} in cart` : 'Choose options'}
      </button>
    )
  }

  return (
    <button
      type="button"
      className="le-add-to-cart"
      disabled={!authReady}
      aria-label={`Add ${product.name} to cart`}
      onClick={() => onAdd(product)}
    >
      Add to cart
    </button>
  )
}
