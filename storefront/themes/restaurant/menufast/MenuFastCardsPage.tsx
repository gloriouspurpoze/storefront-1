'use client'

import { useMemo, useState } from 'react'
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
import { AccountNavLink } from '@/components/account/AccountNavLink'
import './menufast.css'

export function MenuFastCardsPage({
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

  const [activeCat, setActiveCat] = useState<string>('all')
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const { entries, itemCount, subtotal, addItem, removeItem, qtyFor, clearCart } =
    useMenuCart(initialCategories)

  const filteredCategories = useMemo(() => {
    if (activeCat === 'all') return initialCategories
    return initialCategories.filter((c) => c.id === activeCat)
  }, [activeCat, initialCategories])

  const waUrl = buildWhatsAppOrderUrl(whatsapp, siteName, entries)
  const currency = entries[0]?.item.currency ?? initialCategories[0]?.items[0]?.currency ?? 'INR'
  const lines = entries.map((e) => ({ productId: e.item.id, quantity: e.quantity }))
  const showPreferredDate = showPreferredDateOfDelivery(config, config?.themeKey ?? 'menufast-cards')

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
      <div className="mf-phone-wrap">
        <div className="mf-phone">
          <div className="mf-phone-bar">
            <div className="mf-phone-notch" />
          </div>

          <div className="mf-cards-header">
            <div className="mf-cards-logo-row">
              <div className="mf-cards-logo">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '🍽️'
                )}
              </div>
              <div>
                <div className="mf-cards-biz-name">{siteName}</div>
                {tagline && <div className="mf-cards-tagline">{tagline}</div>}
              </div>
            </div>
            {initialCategories.length > 1 && (
              <div className="mf-cards-cats">
                <button
                  type="button"
                  className={`mf-cat-pill${activeCat === 'all' ? ' active' : ''}`}
                  onClick={() => setActiveCat('all')}
                >
                  All
                </button>
                {initialCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`mf-cat-pill${activeCat === cat.id ? ' active' : ''}`}
                    onClick={() => setActiveCat(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mf-cards-body">
            {filteredCategories.length === 0 ? (
              <p className="mf-empty">Menu coming soon — add products in your admin dashboard.</p>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.id} style={{ marginBottom: '1.25rem' }}>
                  {activeCat === 'all' && <div className="mf-cat-title">{cat.name}</div>}
                  {cat.items.map((item) => {
                    const qty = qtyFor(item.id)
                    const inStock = isMenuItemInStock(item)
                    return (
                      <div key={item.id} className="mf-item-card">
                        <div className="mf-item-img">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt="" />
                          ) : (
                            '🍽️'
                          )}
                        </div>
                        <div className="mf-item-info">
                          <div>
                            <div className="mf-item-info-top">
                              <div className="mf-item-card-name">{item.name}</div>
                              <div className="mf-item-card-price">
                                {formatMenuPrice(item.price, item.currency)}
                              </div>
                            </div>
                            {item.description && (
                              <div className="mf-item-card-desc">{item.description}</div>
                            )}
                          </div>
                          <div className="mf-item-card-bottom">
                            {isVegItem(item) && <span className="mf-veg" aria-label="Vegetarian" />}
                            {!inStock ? (
                              <span className="mf-oos-label">Out of stock</span>
                            ) : qty === 0 ? (
                              <button
                                type="button"
                                className="mf-add-btn"
                                aria-label={`Add ${item.name}`}
                                onClick={() => addItem(item)}
                              >
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
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          <div className="mf-cards-footer">
            {itemCount > 0 && (
              <div style={{ marginBottom: '0.75rem', fontSize: '13px', color: '#444' }}>
                {itemCount} item{itemCount !== 1 ? 's' : ''} · {formatMenuPrice(subtotal, currency)}
              </div>
            )}
            <MenuOrderCheckoutBlock
              tenant={tenant}
              lines={lines}
              showPreferredDate={showPreferredDate}
              onClear={clearCart}
              onSuccess={setOrderNumber}
              primaryLabel={itemCount > 0 ? `Pay online · ${formatMenuPrice(subtotal, currency)}` : 'Pay online'}
            />
            {waUrl && itemCount > 0 && (
              <a
                className="mf-min-wa-btn"
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: '0.5rem', display: 'flex' }}
              >
                Or order via WhatsApp
              </a>
            )}
            <div className="mf-auth-links">
              <AccountNavLink />
            </div>
            <div className="mf-powered">Powered by Profixer</div>
          </div>
        </div>
      </div>
    </div>
  )
}
