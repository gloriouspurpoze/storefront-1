'use client'
import type { ReactNode } from 'react'

import Link from 'next/link'
import { Fragment, useState } from 'react'
import type { StorefrontNavLink } from '@/lib/cms-content'
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
import { productHasVariants, formatListPrice } from '@/lib/productVariants'
import { StandardStorefrontNav } from '@/components/StandardStorefrontNav'
import { StoreFooter } from '@/components/chrome/StoreFooter'
import { IconBag, IconCheck } from '@/ui'
import { StoreStatusBadge } from '@/components/StoreStatusBadge'
import { MenuItemDetailModal } from '@/components/MenuItemDetailModal'
import { homepageSectionOrder, THEME_SECTIONS } from '@/lib/storefrontSections'
import './menufast.css'
import '@/components/commerce/menu-board.css'

const MENUFAST_MINIMAL_SECTIONS = THEME_SECTIONS['menufast-minimal']

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
  navLinks,
  footerLinks,
  addonsSlot,
}: {
  initialCategories: PublicMenuCategory[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  /** CMS footer links when present (no hardcoded page-link fallback in minimal). */
  footerLinks?: StorefrontNavLink[]
  /** Paid add-on homepage blocks, rendered above the footer. */
  addonsSlot?: ReactNode
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline || tenant.tagline
  const logoUrl = config?.branding?.logoUrl || tenant.logoUrl
  const whatsapp = config?.branding?.socials?.whatsapp || config?.branding?.contactPhone

  const { cart, entries, itemCount, subtotal, addItem, removeItem, qtyFor, clearCart } =
    useMenuCart(initialCategories)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [modalVariantId, setModalVariantId] = useState<string | undefined>()

  const selectedItem =
    selectedItemId != null
      ? initialCategories.flatMap((c) => c.items).find((item) => item.id === selectedItemId) ?? null
      : null

  const waUrl = buildWhatsAppOrderUrl(whatsapp, siteName, entries)
  const currency = entries[0]?.item.currency ?? 'INR'
  const lines = entries.map((e) => ({
    productId: e.item.id,
    quantity: e.quantity,
    variantId: e.variantId,
  }))
  const showPreferredDate = showPreferredDateOfDelivery(config, config?.themeKey ?? 'menufast-minimal')

  if (orderNumber) {
    return (
      <div className="mf-root mf-min-page">
        <div className="mf-min-success sf-container sf-container--narrow">
          <span className="mf-min-success__icon">
            <IconCheck size={32} />
          </span>
          <h2>Order confirmed</h2>
          <p>Order {orderNumber} — receipt sent to your email.</p>
          <Link href="/" className="sf-btn">
            Back to menu
          </Link>
        </div>
      </div>
    )
  }

  // Only the menu list is a block; the header (logo, status, cart summary) and the checkout
  // footer stay fixed.
  const blocks: Record<(typeof MENUFAST_MINIMAL_SECTIONS)[number], ReactNode> = {
    menu: (
      <div className="mf-min-body">
        {initialCategories.length === 0 ? (
          <p className="mf-empty">Menu coming soon — add products in your admin dashboard.</p>
        ) : (
          initialCategories.map((cat) => (
            <div key={cat.id}>
              <div className="mf-min-cat-label">{cat.name}</div>
              {cat.items.map((item) => {
                const popular = (item.dietary ?? []).some((d) => d.toLowerCase() === 'popular')
                const hasVariants = productHasVariants(item)
                const qty = Object.keys(cart)
                  .filter((k) => k === item.id || k.startsWith(`${item.id}:`))
                  .reduce((sum, k) => sum + (cart[k] ?? 0), 0)
                const inStock = isMenuItemInStock(item)
                return (
                  <div
                    key={item.id}
                    className="mf-min-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedItemId(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedItemId(item.id)
                      }
                    }}
                  >
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
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="mf-min-price">
                        {formatListPrice(item, (amount) => formatMenuPrice(amount, item.currency))}
                      </div>
                      {!inStock ? (
                        <span className="mf-oos-label">Out of stock</span>
                      ) : hasVariants ? (
                        <button
                          type="button"
                          className="mf-add-btn"
                          aria-label={`Choose options for ${item.name}`}
                          onClick={() => setSelectedItemId(item.id)}
                        >
                          ···
                        </button>
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
    ),
  }

  return (
    <div className="mf-root mf-min-page">
      <MenuItemDetailModal
        item={selectedItem}
        open={selectedItem != null}
        onClose={() => {
          setSelectedItemId(null)
          setModalVariantId(undefined)
        }}
        quantity={selectedItem ? qtyFor(selectedItem.id, modalVariantId) : 0}
        onAdd={(variantId) => {
          if (selectedItem) {
            setModalVariantId(variantId)
            addItem(selectedItem, variantId)
          }
        }}
        onRemove={(variantId) => {
          if (selectedItem) {
            setModalVariantId(variantId)
            removeItem(selectedItem.id, variantId)
          }
        }}
      />
      <StandardStorefrontNav
        tenant={{ name: siteName, logoUrl }}
        config={config}
        itemCount={itemCount}
        variant="restaurant"
        navLinks={navLinks}
        onCartClick={() => document.getElementById('mf-order')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />

      <div className="mf-min-shell sf-container">
        <header className="mf-min-intro">
          <div className="mf-min-logo">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span aria-hidden>{siteName.charAt(0)}</span>
            )}
          </div>
          <div>
            <h1 className="mf-min-biz-name">{siteName}</h1>
            {tagline && <p className="mf-min-tagline">{tagline}</p>}
            <StoreStatusBadge config={config} compact />
          </div>
        </header>

        <div className="mf-min-grid">
          <div className="mf-min-menu">
            {homepageSectionOrder(config, MENUFAST_MINIMAL_SECTIONS).map((type) => (
              <Fragment key={type}>{blocks[type as keyof typeof blocks]}</Fragment>
            ))}
          </div>

          <aside id="mf-order" className="mf-min-footer" aria-label="Your order">
            <h2 className="mf-min-order-title">Your order</h2>
            {itemCount > 0 ? (
              <p className="mf-min-order-summary">
                {itemCount} item{itemCount !== 1 ? 's' : ''} · {formatMenuPrice(subtotal, currency)}
              </p>
            ) : (
              <p className="mf-min-order-summary">Add dishes from the menu to start your order.</p>
            )}
            <MenuOrderCheckoutBlock
              tenant={tenant}
              config={config}
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
          </aside>
        </div>
        {addonsSlot}
      </div>

      {itemCount > 0 && (
        <div className="sf-menu-cartbar" data-storefront-bottom-bar="">
          <button
            type="button"
            className="sf-menu-cartbar__btn"
            onClick={() => document.getElementById('mf-order')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <span className="sf-menu-cartbar__count">
              <IconBag size={18} /> {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
            <span>View order · {formatMenuPrice(subtotal, currency)}</span>
          </button>
        </div>
      )}

      <StoreFooter
        name={siteName}
        tagline={tagline}
        logoUrl={logoUrl}
        config={config}
        columns={footerLinks?.length ? [{ title: 'Explore', links: footerLinks }] : []}
        bottomNote={<>Powered by Profixer</>}
      />
    </div>
  )
}
