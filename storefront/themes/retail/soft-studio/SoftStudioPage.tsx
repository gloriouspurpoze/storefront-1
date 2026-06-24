'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import { DeliveryDetailsSection } from '@/components/DeliveryDetailsSection'
import { runStorefrontCheckout } from '@/lib/runStorefrontCheckout'
import {
  formatDeliveryNotes,
  showPreferredDateOfDelivery,
  type DeliveryDetailsValue,
} from '@/lib/templateSettings'
import { formatMoney, useCart } from '../cart'
import type { ThemeTenant } from '../types'
import { AccountNavLink } from '@/components/account/AccountNavLink'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import { StorefrontMenuDrawer } from '@/components/StorefrontMenuDrawer'
import './soft-studio.css'

const THUMB_CLASSES = ['ss-product-thumb-1', 'ss-product-thumb-2', 'ss-product-thumb-3', 'ss-product-thumb-4']
const FREE_SHIPPING_MIN = 1500
const SHIPPING_FEE = 120

const STRIP_ITEMS = [
  { icon: '🌿', text: 'Natural & Organic Fibers' },
  { icon: '✂️', text: 'Handmade with care' },
  { icon: '📦', text: `Free Shipping over ₹${FREE_SHIPPING_MIN.toLocaleString('en-IN')}` },
  { icon: '🎨', text: 'Custom orders welcome' },
]

function shippingCost(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE
}

function ProductThumb({
  product,
  index,
  className,
}: {
  product?: PublicProduct
  index: number
  className?: string
}) {
  const thumbClass = THUMB_CLASSES[index % THUMB_CLASSES.length]
  if (product?.imageUrl) {
    return (
      <div className={`ss-product-thumb ${className ?? ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.name} />
      </div>
    )
  }
  return <div className={`ss-product-thumb ${thumbClass} ${className ?? ''}`}>🛍️</div>
}

export function SoftStudioPage({
  products,
  tenant,
  config,
}: {
  products: PublicProduct[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline || tenant.tagline
  const heroHeadline = config?.content?.heroHeadline
  const heroSubcopy = config?.content?.heroSubcopy || tagline
  const contactEmail = config?.branding?.contactEmail
  const showPreferredDate = showPreferredDateOfDelivery(config, config?.themeKey ?? 'soft-studio')

  const { lines, itemCount, subtotal, addProduct, setQuantity, removeLine, clear } = useCart()

  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsValue>({})

  const ship = useMemo(() => shippingCost(subtotal), [subtotal])
  const total = subtotal + ship
  const heroProducts = products.slice(0, 4)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }, [])

  const handleAdd = useCallback(
    (product: PublicProduct) => {
      if (!product.inStock) return
      addProduct(product)
      showToast(`${product.name} added to cart`)
    },
    [addProduct, showToast],
  )

  const openCheckout = () => {
    setCartOpen(false)
    setCheckoutOpen(true)
    setCheckoutError(null)
    setOrderNumber(null)
  }

  const closeCheckout = () => {
    setCheckoutOpen(false)
    setCartOpen(true)
  }

  const closeAll = () => {
    setCheckoutOpen(false)
    setCartOpen(false)
    setOrderNumber(null)
    setCheckoutError(null)
  }

  const onPlaceOrder = async () => {
    if (!lines.length || checkoutLoading) return
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = name.trim()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setCheckoutError('Please enter a valid email.')
      return
    }
    if (!trimmedName) {
      setCheckoutError('Please enter your name.')
      return
    }

    setCheckoutError(null)
    setCheckoutLoading(true)
    try {
      const result = await runStorefrontCheckout({
        tenantId: tenant.id,
        tenantName: tenant.name,
        brandColor: tenant.brand,
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        customer: { email: trimmedEmail, name: trimmedName, phone: phone.trim() || undefined },
        notes: formatDeliveryNotes(deliveryDetails),
      })
      clear()
      setOrderNumber(result.orderNumber)
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout failed. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  useEffect(() => {
    if (!cartOpen && !checkoutOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cartOpen, checkoutOpen])

  return (
    <div className="ss-root">
      <StorefrontMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} config={config} />
      <nav className="ss-nav">
        <div className="ss-nav-logo">{siteName}</div>
        <ul className="ss-nav-links">
          <li>
            <a href="#products">Shop</a>
          </li>
          <li>
            <a href="#products">Collections</a>
          </li>
          <li>
            <a href="/products">All products</a>
          </li>
          <li>
            <a href="/orders/track">Track order</a>
          </li>
          <li>
            <AccountNavLink />
          </li>
        </ul>
        <div className="ss-nav-right">
          <button
            type="button"
            className="sf-menu-toggle-btn"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-label="Open menu"
          >
            ☰
          </button>
          <AccountProfileLink className="inline-flex items-center justify-center opacity-90 hover:opacity-100" />
          <button type="button" className="ss-cart-btn" onClick={() => setCartOpen(true)}>
            🛍 Cart <span className="ss-cart-count">{itemCount}</span>
          </button>
        </div>
      </nav>

      <div className="ss-hero">
        <div className="ss-hero-text">
          <p className="ss-hero-eyebrow">Curated for you</p>
          <h1 className="ss-hero-h1">
            {heroHeadline ? (
              heroHeadline
            ) : (
              <>
                Every piece
                <br />
                tells a <em>story</em>
              </>
            )}
          </h1>
          <p className="ss-hero-sub">{heroSubcopy}</p>
          <div className="ss-hero-actions">
            <a href="#products" className="ss-btn-primary">
              Shop Now
            </a>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="ss-btn-ghost">
                Contact us
              </a>
            )}
          </div>
        </div>
        <div className="ss-hero-image">
          <div className="ss-hero-image-inner">
            <div className="ss-yarn-blob" />
            <div className="ss-yarn-blob" />
            <div className="ss-yarn-blob" />
            <div className="ss-hero-product-mockup">
              {(heroProducts.length > 0
                ? heroProducts
                : (Array.from({ length: 4 }, (_, i) => ({
                    id: `placeholder-${i}`,
                    name: 'Coming soon',
                    price: 0,
                    currency: 'INR',
                    slug: '',
                    inStock: false,
                  })) as PublicProduct[])
              ).map((p) => (
                <div key={p.id} className="ss-mock-card">
                  <div className="ss-mock-thumb">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} />
                    ) : (
                      '🛍️'
                    )}
                  </div>
                  <div className="ss-mock-name">{p.name}</div>
                  {p.price > 0 && (
                    <div className="ss-mock-price">{formatMoney(p.price, p.currency ?? 'INR')}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ss-strip">
        {STRIP_ITEMS.map((item) => (
          <div key={item.text} className="ss-strip-item">
            <span className="ss-strip-icon">{item.icon}</span>
            <span className="ss-strip-text">{item.text}</span>
          </div>
        ))}
      </div>

      <section id="products" className="ss-section">
        <p className="ss-section-label">New Arrivals</p>
        <h2 className="ss-section-title">Made for slow living</h2>
        {products.length === 0 ? (
          <p className="ss-empty-products">
            Products coming soon — add items in your admin dashboard under Store / Products.
          </p>
        ) : (
          <div className="ss-products-grid">
            {products.map((product, index) => (
              <article key={product.id} className="ss-product-card">
                <ProductThumb product={product} index={index} />
                {index === 0 && <span className="ss-product-tag">Featured</span>}
                <div className="ss-product-info">
                  <div className="ss-product-name">{product.name}</div>
                  {(product.shortDescription || product.description) && (
                    <div className="ss-product-desc">
                      {product.shortDescription || product.description}
                    </div>
                  )}
                  <div className="ss-product-footer">
                    <span className="ss-product-price">
                      {formatMoney(product.price, product.currency)}
                    </span>
                    <button
                      type="button"
                      className="ss-add-btn"
                      disabled={!product.inStock}
                      onClick={() => handleAdd(product)}
                    >
                      {product.inStock ? 'Add to cart' : 'Out of stock'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="ss-footer">
        <div className="ss-footer-brand">
          <div className="ss-footer-logo">{siteName}</div>
          <p className="ss-footer-tagline">{tagline}</p>
        </div>
        <div>
          <div className="ss-footer-col-title">Shop</div>
          <ul className="ss-footer-links">
            <li>
              <a href="#products">Featured</a>
            </li>
            <li>
              <a href="/products">All products</a>
            </li>
          </ul>
        </div>
        <div>
          <div className="ss-footer-col-title">Help</div>
          <ul className="ss-footer-links">
            <li>
              <a href="/orders/track">Track order</a>
            </li>
            {contactEmail && (
              <li>
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <div className="ss-footer-col-title">Connect</div>
          <ul className="ss-footer-links">
            {config?.branding?.socials?.instagram && (
              <li>
                <a href={config.branding.socials.instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
            )}
            {config?.branding?.socials?.whatsapp && (
              <li>
                <a href={`https://wa.me/${config.branding.socials.whatsapp.replace(/\D/g, '')}`}>
                  WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>
      </footer>
      <div className="ss-footer-bottom">© {new Date().getFullYear()} {siteName}. All rights reserved.</div>

      <div
        className={`ss-overlay ${cartOpen ? 'open' : ''}`}
        onClick={() => setCartOpen(false)}
        role="presentation"
      />
      <aside className={`ss-cart-sidebar ${cartOpen ? 'open' : ''}`} aria-label="Shopping cart">
        <div className="ss-cart-header">
          <span className="ss-cart-title">Your Cart</span>
          <button type="button" className="ss-close-btn" onClick={() => setCartOpen(false)} aria-label="Close cart">
            ✕
          </button>
        </div>
        <div className="ss-cart-items">
          {lines.length === 0 ? (
            <div className="ss-cart-empty">
              <span className="ss-cart-empty-icon">🧺</span>
              <div>Your cart is empty</div>
              <div style={{ fontSize: '0.78rem', marginTop: '8px', color: 'var(--ss-muted)' }}>
                Add some lovely pieces from the shop!
              </div>
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.productId} className="ss-cart-item">
                <div className="ss-cart-item-thumb">
                  {line.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.imageUrl} alt={line.name} />
                  ) : (
                    '🛍️'
                  )}
                </div>
                <div className="ss-cart-item-details">
                  <div className="ss-cart-item-name">{line.name}</div>
                  <div className="ss-qty-control">
                    <button
                      type="button"
                      className="ss-qty-btn"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="ss-qty-val">{line.quantity}</span>
                    <button
                      type="button"
                      className="ss-qty-btn"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ss-remove-item"
                    onClick={() => removeLine(line.productId)}
                  >
                    Remove
                  </button>
                </div>
                <div className="ss-cart-item-price">
                  {formatMoney(line.price * line.quantity, line.currency)}
                </div>
              </div>
            ))
          )}
        </div>
        {lines.length > 0 && (
          <div className="ss-cart-footer">
            <div className="ss-cart-summary">
              <div className="ss-summary-row">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal, lines[0]?.currency ?? 'INR')}</span>
              </div>
              <div className="ss-summary-row">
                <span>Shipping</span>
                <span>{ship === 0 ? 'Free' : formatMoney(ship, lines[0]?.currency ?? 'INR')}</span>
              </div>
              <div className="ss-summary-row total">
                <span>Total</span>
                <span>{formatMoney(total, lines[0]?.currency ?? 'INR')}</span>
              </div>
            </div>
            <button type="button" className="ss-checkout-btn" onClick={openCheckout}>
              Proceed to Checkout →
            </button>
            <button type="button" className="ss-continue-btn" onClick={() => setCartOpen(false)}>
              Continue Shopping
            </button>
          </div>
        )}
      </aside>

      <div className={`ss-checkout-modal ${checkoutOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="ss-checkout-box">
          {!orderNumber ? (
            <div className="ss-checkout-form">
              <h2 className="ss-checkout-title">Checkout</h2>
              <p className="ss-checkout-subtitle">Almost there! Fill in your details below.</p>

              <div className="ss-order-summary-box">
                <div className="ss-order-summary-title">Order Summary</div>
                {lines.map((line) => (
                  <div key={line.productId} className="ss-order-line">
                    <span>
                      {line.name} ×{line.quantity}
                    </span>
                    <span>{formatMoney(line.price * line.quantity, line.currency)}</span>
                  </div>
                ))}
                <div className="ss-order-line">
                  <span>Shipping</span>
                  <span>{ship === 0 ? 'Free' : formatMoney(ship, lines[0]?.currency ?? 'INR')}</span>
                </div>
                <div className="ss-order-line total">
                  <span>Total</span>
                  <span>{formatMoney(total, lines[0]?.currency ?? 'INR')}</span>
                </div>
              </div>

              <div className="ss-form-section">
                <div className="ss-form-section-title">Contact</div>
                <div className="ss-form-row full">
                  <div className="ss-form-group">
                    <label htmlFor="ss-name">Full Name</label>
                    <input
                      id="ss-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                </div>
                <div className="ss-form-row">
                  <div className="ss-form-group">
                    <label htmlFor="ss-email">Email</label>
                    <input
                      id="ss-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                    />
                  </div>
                  <div className="ss-form-group">
                    <label htmlFor="ss-phone">Phone</label>
                    <input
                      id="ss-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              <div className="ss-form-section">
                <div className="ss-form-section-title">Delivery</div>
                <DeliveryDetailsSection
                  value={deliveryDetails}
                  onChange={setDeliveryDetails}
                  showPreferredDate={showPreferredDate}
                  variant="plain"
                />
              </div>

              {checkoutError && <p className="ss-checkout-error">{checkoutError}</p>}

              <button
                type="button"
                className="ss-place-order-btn"
                disabled={checkoutLoading || !lines.length}
                onClick={() => void onPlaceOrder()}
              >
                {checkoutLoading ? 'Processing…' : 'Pay & place order'}
              </button>
              <button type="button" className="ss-back-to-cart" onClick={closeCheckout}>
                ← Back to Cart
              </button>
            </div>
          ) : (
            <div className="ss-success-screen show">
              <span className="ss-success-icon">🎉</span>
              <h2 className="ss-success-title">Order Placed!</h2>
              <p className="ss-success-sub">Thank you for your order. We will email you confirmation shortly.</p>
              <div className="ss-success-order">
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--ss-muted)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Order {orderNumber}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ss-muted)' }}>
                  A confirmation will be sent to your email.
                </div>
              </div>
              <button type="button" className="ss-place-order-btn" onClick={closeAll}>
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`ss-toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
