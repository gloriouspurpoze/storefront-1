'use client'

import { useState } from 'react'
import type { PublicMenuCategory, StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '../types'
import { MenuOrderCheckoutBlock } from '../MenuOrderCheckoutBlock'
import {
  buildWhatsAppOrderUrl,
  formatMenuPrice,
  isVegItem,
  useMenuCart,
} from './useMenuCart'
import { showPreferredDateOfDelivery } from '@/lib/templateSettings'
import { isMenuItemInStock } from '@/lib/storefront-api'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import { StorefrontMenuDrawer } from '@/components/StorefrontMenuDrawer'
import './menufast.css'

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function MenuFastMinimalPage({
  initialCategories,
  tenant,
  config,
}: {
  initialCategories: PublicMenuCategory[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline || tenant.tagline
  const logoUrl = config?.branding?.logoUrl || tenant.logoUrl
  const whatsapp = config?.branding?.socials?.whatsapp || config?.branding?.contactPhone

  const { entries, itemCount, subtotal, addItem, removeItem, qtyFor, clearCart } =
    useMenuCart(initialCategories)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const waUrl = buildWhatsAppOrderUrl(whatsapp, siteName, entries)
  const currency = entries[0]?.item.currency ?? 'INR'
  const lines = entries.map((e) => ({ productId: e.item.id, quantity: e.quantity }))
  const showPreferredDate = showPreferredDateOfDelivery(config, config?.themeKey ?? 'menufast-minimal')

  if (orderNumber) {
    return (
      <div className="mf-root">
        <div className="mf-phone-wrap">
          <div className="mf-phone" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px' }}>🎉</div>
              <h2 style={{ marginTop: '1rem', fontSize: '20px' }}>Order confirmed</h2>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '0.5rem' }}>
                Order {orderNumber} — receipt sent to your email.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mf-root">
      <StorefrontMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        config={config}
        showShippingPolicy={false}
      />
      <div className="mf-phone-wrap">
        <div className="mf-phone">
          <div className="mf-phone-bar">
            <div className="mf-phone-notch" />
          </div>

          <div className="mf-min-header">
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '0.5rem' }}>
              <button
                type="button"
                className="sf-menu-toggle-btn"
                onClick={() => setMenuOpen(true)}
                aria-expanded={menuOpen}
                aria-label="Open menu"
              >
                ☰
              </button>
              <AccountProfileLink className="inline-flex items-center justify-center hover:opacity-80" />
            </div>
            <div className="mf-min-logo-row">
              <div className="mf-min-logo">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '🍽️'
                )}
              </div>
              <div>
                <div className="mf-min-biz-name">{siteName}</div>
                {tagline && <div className="mf-min-tagline">{tagline}</div>}
              </div>
            </div>
            {itemCount > 0 && (
              <div className="mf-min-tagline" style={{ marginTop: '0.5rem' }}>
                Cart: {itemCount} item{itemCount !== 1 ? 's' : ''} · {formatMenuPrice(subtotal, currency)}
              </div>
            )}
          </div>

          <div className="mf-min-body">
            {initialCategories.length === 0 ? (
              <p className="mf-empty">Menu coming soon — add products in your admin dashboard.</p>
            ) : (
              initialCategories.map((cat) => (
                <div key={cat.id}>
                  <div className="mf-min-cat-label">{cat.name}</div>
                  {cat.items.map((item) => {
                    const popular = (item.dietary ?? []).some((d) => d.toLowerCase() === 'popular')
                    const qty = qtyFor(item.id)
                    const inStock = isMenuItemInStock(item)
                    return (
                      <div key={item.id} className="mf-min-row">
                        <div style={{ flex: 1 }}>
                          <div className="mf-min-item-name">
                            {isVegItem(item) && <span className="mf-veg" aria-label="Vegetarian" />}
                            {item.name}
                            {popular && <span className="mf-min-badge">Popular</span>}
                          </div>
                          {item.description && (
                            <div className="mf-min-item-desc">{item.description}</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="mf-min-price">{formatMenuPrice(item.price, item.currency)}</div>
                          {!inStock ? (
                            <span className="mf-oos-label">Out of stock</span>
                          ) : qty === 0 ? (
                            <button type="button" className="mf-add-btn" aria-label={`Add ${item.name}`} onClick={() => addItem(item)}>
                              +
                            </button>
                          ) : (
                            <div className="mf-qty-pill">
                              <button type="button" aria-label="Decrease" onClick={() => removeItem(item.id)}>
                                −
                              </button>
                              <span>{qty}</span>
                              <button type="button" aria-label="Increase" onClick={() => addItem(item)}>
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          <div className="mf-min-footer">
            <MenuOrderCheckoutBlock
              tenant={tenant}
              lines={lines}
              showPreferredDate={showPreferredDate}
              onClear={clearCart}
              onSuccess={setOrderNumber}
              primaryLabel="Pay online"
            />
            {waUrl && (
              <a
                className="mf-min-wa-btn"
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: '0.5rem' }}
              >
                <WhatsAppIcon />
                Or order via WhatsApp
              </a>
            )}
            <div className="mf-powered">Powered by Profixer</div>
          </div>
        </div>
      </div>
    </div>
  )
}
