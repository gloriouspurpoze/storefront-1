'use client'

import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { PublicMenuItem } from '@/lib/storefront-api'
import { isMenuItemInStock } from '@/lib/storefront-api'
import { isVegItem } from '@/themes/restaurant/menufast/useMenuCart'
import { formatMoney } from '@/lib/format'
import './menu-item-detail-modal.css'

export function MenuItemDetailModal({
  item,
  open,
  onClose,
  quantity,
  onAdd,
  onRemove,
}: {
  item: PublicMenuItem | null
  open: boolean
  onClose: () => void
  quantity: number
  onAdd: () => void
  onRemove: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  if (!open || !item || typeof document === 'undefined') return null

  const inStock = isMenuItemInStock(item)
  const popular = (item.dietary ?? []).some((d) => d.toLowerCase() === 'popular')

  return createPortal(
    <div
      className="sf-menu-item-modal open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sf-menu-item-modal-title"
      onClick={onOverlayClick}
    >
      <div className="sf-menu-item-modal__card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sf-menu-item-modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        {item.imageUrl ? (
          <div className="sf-menu-item-modal__image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.name} />
          </div>
        ) : null}
        <div className="sf-menu-item-modal__body">
          <div className="sf-menu-item-modal__title-row">
            {isVegItem(item) && <span className="sf-menu-item-modal__veg" aria-label="Vegetarian" />}
            <h2 id="sf-menu-item-modal-title" className="sf-menu-item-modal__title">
              {item.name}
            </h2>
            {popular && <span className="sf-menu-item-modal__badge">Popular</span>}
          </div>
          <p className="sf-menu-item-modal__price">{formatMoney(item.price, item.currency)}</p>
          {item.description ? <p className="sf-menu-item-modal__desc">{item.description}</p> : null}
          {(item.dietary ?? []).filter((d) => d.toLowerCase() !== 'popular').length > 0 ? (
            <div className="sf-menu-item-modal__tags">
              {item.dietary
                ?.filter((d) => d.toLowerCase() !== 'popular')
                .map((d) => (
                  <span key={d} className="sf-menu-item-modal__tag">
                    {d}
                  </span>
                ))}
            </div>
          ) : null}
          <div className="sf-menu-item-modal__actions">
            {!inStock ? (
              <span className="sf-menu-item-modal__oos">Out of stock</span>
            ) : quantity === 0 ? (
              <button type="button" className="sf-menu-item-modal__add" onClick={onAdd}>
                Add to cart
              </button>
            ) : (
              <div className="sf-menu-item-modal__qty">
                <button type="button" aria-label="Decrease quantity" onClick={onRemove}>
                  −
                </button>
                <span>{quantity}</span>
                <button type="button" aria-label="Increase quantity" onClick={onAdd}>
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
