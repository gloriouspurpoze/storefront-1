'use client'

import Link from 'next/link'
import { formatMoney } from '@/lib/format'
import { ButtonLink, IconBag, IconTrash, QuantityStepper } from '@/ui'
import { cartLineKey } from '@/lib/productVariants'
import { cartLineProductName, groupLinesBySeller, useCart } from './cart'
import { useMarketplaceQuote } from './useMarketplaceQuote'
import './marketplace.css'

/** Cart grouped by seller — each group is one parcel with its own shipping line. */
export function MarketplaceCartClient({ tenantId }: { tenantId: string }) {
  const { lines, subtotal, itemCount, setQuantity, removeLine } = useCart()
  const { quote, error, loading } = useMarketplaceQuote(tenantId, lines)
  const groups = groupLinesBySeller(lines)
  const shippingFor = (sellerSlug: string) => quote?.sellerGroups.find((g) => g.sellerSlug === sellerSlug)?.shippingInr

  if (!lines.length) {
    return (
      <div className="mk-success">
        <IconBag size={32} />
        <h2>Your cart is empty</h2>
        <p>Discover products from independent sellers.</p>
        <div className="mk-success__actions">
          <ButtonLink href="/products">Start shopping</ButtonLink>
          <ButtonLink href="/sellers" variant="secondary">
            Browse sellers
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <div className="mk-cart">
      <div>
        {groups.map((g) => {
          const ship = shippingFor(g.sellerSlug)
          return (
            <section key={g.sellerSlug} className="mk-cart-group" aria-label={`Items from ${g.sellerName}`}>
              <header className="mk-cart-group__head">
                <span>
                  Sold by{' '}
                  <Link href={`/store/${g.sellerSlug}`} className="mk-cart-group__seller">
                    {g.sellerName}
                  </Link>
                </span>
                <span>{g.lines.length === 1 ? '1 item' : `${g.lines.length} items`}</span>
              </header>
              <ul className="mk-cart-group__lines">
                {g.lines.map((l) => (
                  <li key={cartLineKey(l.productId, l.variantId)} className="mk-cart-line">
                    {l.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imageUrl} alt="" className="mk-cart-line__img" />
                    ) : (
                      <span className="mk-cart-line__img" aria-hidden />
                    )}
                    <div>
                      <p className="mk-cart-line__title">
                        {l.slug ? <Link href={`/products/${l.slug}`}>{cartLineProductName(l)}</Link> : cartLineProductName(l)}
                      </p>
                      {l.variantName ? <p className="mk-summary__note">{l.variantName}</p> : null}
                      <div className="mk-cart-line__controls">
                        <QuantityStepper value={l.quantity} onChange={(q) => setQuantity(l.productId, q, l.variantId)} size="sm" />
                        <button
                          type="button"
                          className="sf-icon-btn"
                          aria-label={`Remove ${cartLineProductName(l)}`}
                          onClick={() => removeLine(l.productId, l.variantId)}
                        >
                          <IconTrash size={18} />
                        </button>
                      </div>
                    </div>
                    <span className="mk-cart-line__price">{formatMoney(l.price * l.quantity, l.currency)}</span>
                  </li>
                ))}
              </ul>
              <footer className="mk-cart-group__foot">
                <span>Shipping from {g.sellerName}</span>
                <span>{ship != null ? formatMoney(ship, 'INR') : loading ? '…' : '—'}</span>
              </footer>
            </section>
          )
        })}
      </div>

      <aside className="mk-summary" aria-label="Order summary">
        <h2>Order summary</h2>
        <div className="mk-summary__row">
          <span>
            Items ({itemCount})
          </span>
          <span>{formatMoney(quote?.subtotalInr ?? subtotal, 'INR')}</span>
        </div>
        <div className="mk-summary__row">
          <span>
            Shipping ({groups.length} {groups.length === 1 ? 'seller' : 'sellers'})
          </span>
          <span>{quote ? formatMoney(quote.shippingInr, 'INR') : '…'}</span>
        </div>
        <div className="mk-summary__row mk-summary__row--total">
          <span>Total</span>
          <span>{quote ? formatMoney(quote.totalInr, 'INR') : formatMoney(subtotal, 'INR')}</span>
        </div>
        {error ? <p className="mk-alert">{error} Remove unavailable items to continue.</p> : null}
        {error ? (
          <button type="button" className="sf-btn sf-btn--block sf-btn--lg" disabled>
            Checkout
          </button>
        ) : (
          <ButtonLink href="/checkout" block size="lg">
            Checkout
          </ButtonLink>
        )}
        <p className="mk-summary__note">
          One payment covers every seller. Each seller ships their items separately.
        </p>
      </aside>
    </div>
  )
}
