'use client'

import type { PublicMenuItem } from '@/lib/storefront-api'
import { isVariantInStock, productHasVariants } from '@/lib/productVariants'
import { isVegItem } from './useMenuCart'

export function MenuFastCardsAddControl({
  item,
  qty,
  authReady,
  onSelectOptions,
  onAdd,
  onRemove,
}: {
  item: PublicMenuItem
  qty: number
  authReady: boolean
  onSelectOptions: () => void
  onAdd: () => void
  onRemove: () => void
}) {
  const hasVariants = productHasVariants(item)
  const inStock = isVariantInStock(item)
  const actionsDisabled = !authReady

  return (
    <div className="mf-item-card-bottom">
      {isVegItem(item) ? <span className="mf-veg" aria-label="Vegetarian" /> : <span aria-hidden />}
      {!inStock ? (
        <span className="mf-sold-tag">Sold out</span>
      ) : hasVariants ? (
        <button
          type="button"
          className={`mf-add-btn mf-add-btn--options${qty > 0 ? ' mf-add-btn--has-qty' : ''}`}
          aria-label={`Choose options for ${item.name}${qty > 0 ? `, ${qty} in cart` : ''}`}
          disabled={actionsDisabled}
          onClick={onSelectOptions}
        >
          {qty > 0 ? qty : '···'}
        </button>
      ) : qty === 0 ? (
        <button
          type="button"
          className="mf-add-btn"
          aria-label={`Add ${item.name}`}
          disabled={actionsDisabled}
          onClick={onAdd}
        >
          +
        </button>
      ) : (
        <div className="mf-qty-pill">
          <button type="button" aria-label={`Decrease ${item.name}`} onClick={onRemove}>
            −
          </button>
          <span aria-live="polite">{qty}</span>
          <button
            type="button"
            aria-label={`Increase ${item.name}`}
            disabled={actionsDisabled}
            onClick={onAdd}
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}
