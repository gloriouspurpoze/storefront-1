'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { PublicMenuItem } from '@/lib/storefront-api'
import { cartLineKey, getEffectivePrice } from '@/lib/productVariants'
import {
  formatMenuPrice,
  menuCartLineLabel,
  type MenuCartEntry,
} from './useMenuCart'

export function MenuFastCardsCart({
  entries,
  itemCount,
  subtotal,
  currency,
  authReady,
  onAdd,
  onRemove,
  onClear,
  checkoutSlot,
  onExpandedChange,
}: {
  entries: MenuCartEntry[]
  itemCount: number
  subtotal: number
  currency: string
  authReady: boolean
  onAdd: (item: PublicMenuItem, variantId?: string) => void
  onRemove: (itemId: string, variantId?: string) => void
  onClear: () => void
  checkoutSlot?: ReactNode
  onExpandedChange?: (expanded: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isEmpty = entries.length === 0

  useEffect(() => {
    if (isEmpty) setExpanded(false)
  }, [isEmpty])

  useEffect(() => {
    onExpandedChange?.(expanded)
  }, [expanded, onExpandedChange])

  const closePanel = () => setExpanded(false)

  return (
    <>
      {expanded ? (
        <>
          <button
            type="button"
            className="mf-cards-cart-backdrop"
            aria-label="Close cart"
            onClick={closePanel}
          />
          <div
            id="mf-cart-panel"
            className="mf-cards-cart-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mf-cart-panel-title"
          >
            <div className="mf-cards-cart-panel-head">
              <div>
                <h2 id="mf-cart-panel-title" className="mf-cards-cart-panel-title">
                  Your order
                </h2>
                <p className="mf-cards-cart-panel-meta">
                  {itemCount} item{itemCount !== 1 ? 's' : ''} · {formatMenuPrice(subtotal, currency)}
                </p>
              </div>
              <button type="button" className="mf-cards-cart-clear" onClick={onClear}>
                Clear all
              </button>
            </div>

            <div className="mf-cards-cart-scroll">
              <div className="mf-cards-cart-lines">
                {isEmpty ? (
                  <p className="mf-cart-empty">Your cart is empty. Add items from the menu.</p>
                ) : (
                  <ul className="mf-cards-cart-list">
                    {entries.map(({ item, quantity, variantId }) => {
                      const unitPrice = getEffectivePrice(item, variantId)
                      const lineTotal = unitPrice * quantity
                      return (
                        <li key={cartLineKey(item.id, variantId)} className="mf-cards-cart-line">
                          <div className="mf-cards-cart-line-info">
                            <p className="mf-cards-cart-line-name">{menuCartLineLabel(item, variantId)}</p>
                            <p className="mf-cards-cart-line-price">
                              {formatMenuPrice(unitPrice, item.currency)} × {quantity}
                            </p>
                          </div>
                          <div className="mf-cards-cart-line-end">
                            <p className="mf-cards-cart-line-total">{formatMenuPrice(lineTotal, item.currency)}</p>
                            <div className="mf-qty-pill mf-qty-pill--cart">
                              <button
                                type="button"
                                aria-label={`Decrease ${menuCartLineLabel(item, variantId)}`}
                                onClick={() => onRemove(item.id, variantId)}
                              >
                                −
                              </button>
                              <span aria-live="polite">{quantity}</span>
                              <button
                                type="button"
                                aria-label={`Increase ${menuCartLineLabel(item, variantId)}`}
                                disabled={!authReady}
                                onClick={() => onAdd(item, variantId)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {!isEmpty ? (
                <div className="mf-cards-cart-total-row">
                  <span>Subtotal</span>
                  <span>{formatMenuPrice(subtotal, currency)}</span>
                </div>
              ) : null}

              {checkoutSlot ? <div className="mf-cards-cart-checkout">{checkoutSlot}</div> : null}
            </div>

            <button type="button" className="mf-cards-cart-close" onClick={closePanel}>
              Close
            </button>
          </div>
        </>
      ) : null}

      <div className="mf-cards-dock" aria-label="Cart">
        {itemCount > 0 ? (
          <button
            type="button"
            className="mf-cart-summary"
            aria-expanded={expanded}
            aria-controls="mf-cart-panel"
            onClick={() => setExpanded(true)}
          >
            <span className="mf-cart-left">
              <span className="mf-cart-count" aria-hidden>
                {itemCount}
              </span>
              <span className="mf-cart-label">
                {itemCount} item{itemCount !== 1 ? 's' : ''} · {formatMenuPrice(subtotal, currency)}
                <span>Tap to review &amp; order</span>
              </span>
            </span>
            <span className="mf-cart-action">Review →</span>
          </button>
        ) : (
          <p className="mf-cart-empty mf-cart-empty--footer">Add items from the menu to start your order.</p>
        )}
      </div>
    </>
  )
}
