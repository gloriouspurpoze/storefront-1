'use client'

import type { PublicProduct } from '@/lib/storefront-api'
import { isVariantInStock, productHasVariants } from '@/lib/productVariants'

function InCartBadge({ qty, productName }: { qty: number; productName: string }) {
  return (
    <div className="le-in-cart" aria-label={`${productName}: ${qty} in cart`} role="status">
      <span className="le-in-cart__count" aria-live="polite">
        {qty}
      </span>
      <span className="le-in-cart__label">In cart</span>
    </div>
  )
}

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
      <div className="le-card-actions">
        <button type="button" className="le-add-to-cart le-add-to-cart--oos" disabled aria-disabled="true">
          Out of stock
        </button>
      </div>
    )
  }

  if (hasVariants) {
    return (
      <div className="le-card-actions">
        {variantQty > 0 ? (
          <button
            type="button"
            className="le-in-cart le-in-cart--action"
            disabled={!authReady}
            aria-label={`${product.name}: ${variantQty} in cart. Choose other options`}
            onClick={() => onSelectOptions?.(product)}
          >
            <span className="le-in-cart__count" aria-live="polite">
              {variantQty}
            </span>
            <span className="le-in-cart__label">In cart</span>
          </button>
        ) : (
          <button
            type="button"
            className="le-add-to-cart"
            disabled={!authReady}
            aria-label={`Choose options for ${product.name}`}
            onClick={() => onSelectOptions?.(product)}
          >
            Choose options
          </button>
        )}
      </div>
    )
  }

  if (variantQty > 0) {
    return (
      <div className="le-card-actions">
        <InCartBadge qty={variantQty} productName={product.name} />
      </div>
    )
  }

  return (
    <div className="le-card-actions">
      <button
        type="button"
        className="le-add-to-cart"
        disabled={!authReady}
        aria-label={`Add ${product.name} to cart`}
        onClick={() => onAdd(product)}
      >
        Add to cart
      </button>
    </div>
  )
}
