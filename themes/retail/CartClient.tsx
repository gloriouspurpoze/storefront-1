'use client'

import Link from 'next/link'
import { RequireStorefrontAuth } from '@/components/account/RequireStorefrontAuth'
import { formatMoney, useCart } from './cart'
import './retail-cart.css'

function themeRootClass(themeKey?: string): string {
  if (themeKey === 'soft-studio') return 'ss-root sf-cart-page'
  if (themeKey === 'luxe-essence') return 'le-root sf-cart-page'
  return 'sf-cart-page'
}

export function CartClient({ themeKey }: { themeKey?: string }) {
  const { lines, subtotal, itemCount, setQuantity, removeLine } = useCart()
  const currency = lines[0]?.currency ?? 'INR'
  const rootClass = themeRootClass(themeKey)

  return (
    <RequireStorefrontAuth returnPath="/cart" title="Sign in to view your cart">
      {!lines.length ? (
        <div className={rootClass}>
          <div className="sf-cart-empty">
            <div className="sf-cart-empty-icon" aria-hidden>
              🛍️
            </div>
            <h2 className="sf-cart-empty-title">Your cart is empty</h2>
            <p className="sf-cart-empty-sub">Add items from the shop to get started.</p>
            <Link href="/products" className="sf-cart-cta-primary">
              Browse products
            </Link>
          </div>
        </div>
      ) : (
        <div className={rootClass}>
          <div className="sf-cart-layout">
            <section aria-label="Cart items">
              <ul className="sf-cart-lines">
                {lines.map((line) => (
                  <li key={line.productId} className="sf-cart-line">
                    <div className="sf-cart-line-thumb">
                      {line.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.imageUrl} alt="" />
                      ) : (
                        <span className="sf-cart-line-fallback">{line.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="sf-cart-line-body">
                      <Link href={`/products/${line.slug}`} className="sf-cart-line-name">
                        {line.name}
                      </Link>
                      <p className="sf-cart-line-unit">{formatMoney(line.price, line.currency)} each</p>
                      <div className="sf-cart-line-actions">
                        <div className="sf-qty-stepper" role="group" aria-label={`Quantity for ${line.name}`}>
                          <button
                            type="button"
                            className="sf-qty-btn"
                            aria-label="Decrease quantity"
                            onClick={() => setQuantity(line.productId, line.quantity - 1)}
                          >
                            −
                          </button>
                          <span className="sf-qty-value">{line.quantity}</span>
                          <button
                            type="button"
                            className="sf-qty-btn"
                            aria-label="Increase quantity"
                            onClick={() => setQuantity(line.productId, line.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="sf-cart-remove"
                          onClick={() => removeLine(line.productId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="sf-cart-line-total">{formatMoney(line.price * line.quantity, line.currency)}</p>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="sf-cart-summary" aria-label="Order summary">
              <h2 className="sf-cart-summary-title">Order summary</h2>
              <p className="sf-cart-summary-count">
                {itemCount} item{itemCount === 1 ? '' : 's'}
              </p>
              <div className="sf-cart-summary-row">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal, currency)}</span>
              </div>
              <p className="sf-cart-summary-note">Shipping and taxes calculated at checkout.</p>
              <Link href="/checkout" className="sf-cart-cta-primary sf-cart-cta-block">
                Proceed to checkout
              </Link>
              <Link href="/products" className="sf-cart-cta-secondary">
                Continue shopping
              </Link>
              <p className="sf-cart-trust">🔒 Secure checkout · Prices verified on our server</p>
            </aside>
          </div>
        </div>
      )}
    </RequireStorefrontAuth>
  )
}
