'use client'

import { useMemo, useState } from 'react'
import type { PublicMenuCategory, StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '../types'
import { MenuFastCardsCheckout } from './MenuFastCardsCheckout'
import { buildWhatsAppOrderUrl, formatMenuPrice, useMenuCart } from './useMenuCart'
import { showPreferredDateOfDelivery } from '@/lib/templateSettings'
import { MenuFastCardsBrand, MenuFastCardsToolbar } from './MenuFastCardsHeader'
import {
  MenuFastCardsCategoryNav,
  type MenuCategoryFilter,
} from './MenuFastCardsCategoryNav'
import { MenuFastCardsGrid } from './MenuFastCardsGrid'
import { MenuFastCardsEmpty } from './MenuFastCardsEmpty'
import { MenuFastCardsCart } from './MenuFastCardsCart'
import { MenuFastCardsFooter } from './MenuFastCardsFooter'
import { MenuFastCardsHero } from './MenuFastCardsHero'
import { MenuFastCardsMenuDrawer } from './MenuFastCardsMenuDrawer'
import { MenuFastCardsSearchRow } from './MenuFastCardsSearch'
import { MenuItemDetailModal } from '@/components/MenuItemDetailModal'
import { isWhatsAppOrderEnabled } from '@/lib/storefrontPaymentMethods'
import { countMenuItems, filterMenuCategories } from '@/lib/menuCatalog'
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
  const tagline = config?.branding?.tagline
  const logoUrl = config?.branding?.logoUrl || tenant.logoUrl
  const whatsapp = config?.branding?.socials?.whatsapp || config?.branding?.contactPhone
  const showWhatsApp = isWhatsAppOrderEnabled(config)

  const [activeCat, setActiveCat] = useState<MenuCategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartExpanded, setCartExpanded] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const selectedItem =
    selectedItemId != null
      ? initialCategories.flatMap((c) => c.items).find((item) => item.id === selectedItemId) ?? null
      : null
  const { cart, entries, itemCount, subtotal, addItem, removeItem, qtyFor, clearCart, authReady } =
    useMenuCart(initialCategories)

  const filteredCategories = useMemo(
    () => filterMenuCategories(initialCategories, { categoryId: activeCat, searchQuery }),
    [activeCat, initialCategories, searchQuery],
  )

  const totalMenuItems = useMemo(() => countMenuItems(initialCategories), [initialCategories])
  const visibleCategories = filteredCategories
  const visibleMenuItems = useMemo(() => countMenuItems(visibleCategories), [visibleCategories])
  const isGlobalEmpty = totalMenuItems === 0
  const hasSearch = searchQuery.trim().length > 0
  const isSearchEmpty = !isGlobalEmpty && hasSearch && visibleMenuItems === 0
  const isCategoryEmpty = !isGlobalEmpty && !hasSearch && visibleMenuItems === 0 && activeCat !== 'all'

  const waUrl = buildWhatsAppOrderUrl(whatsapp, siteName, entries)
  const currency = entries[0]?.item.currency ?? initialCategories[0]?.items[0]?.currency ?? 'INR'
  const lines = entries.map((e) => ({
    productId: e.item.id,
    quantity: e.quantity,
    variantId: e.variantId,
  }))
  const showPreferredDate = showPreferredDateOfDelivery(config, config?.themeKey ?? 'menufast-cards')

  if (orderNumber) {
    return (
      <div className="mf-root theme-menufast-cards">
        <div className="mf-phone-wrap">
          <div className="mf-phone mf-phone--confirmed">
            <div className="mf-order-confirmed">
              <div className="mf-order-confirmed-icon" aria-hidden />
              <h2 className="mf-order-confirmed-title">Order confirmed</h2>
              <p className="mf-order-confirmed-copy">
                Order {orderNumber} — receipt sent to your email.
              </p>
              <button
                type="button"
                className="mf-order-confirmed-home"
                onClick={() => setOrderNumber(null)}
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mf-root theme-menufast-cards">
      <MenuFastCardsMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        config={config}
        showShippingPolicy
        shippingPolicyLabel="Delivery policy"
      />
      <MenuItemDetailModal
        item={selectedItem}
        open={selectedItem != null}
        onClose={() => setSelectedItemId(null)}
        getQuantity={(variantId) =>
          selectedItem ? qtyFor(selectedItem.id, variantId) : 0
        }
        actionsDisabled={!authReady}
        onAdd={(variantId) => {
          if (selectedItem) addItem(selectedItem, variantId)
        }}
        onRemove={(variantId) => {
          if (selectedItem) removeItem(selectedItem.id, variantId)
        }}
      />
      <div className="mf-phone-wrap">
        <div className={`mf-phone${cartExpanded ? ' mf-phone--cart-open' : ''}`}>
          <div className="mf-phone-bar">
            <div className="mf-phone-notch" />
          </div>

          <div className="mf-cards-sticky">
            <MenuFastCardsToolbar
              tenant={tenant}
              config={config}
              menuOpen={menuOpen}
              onMenuOpen={() => setMenuOpen(true)}
              searchExpanded={searchExpanded}
              onSearchExpandedChange={setSearchExpanded}
              searchQuery={searchQuery}
            />
            <MenuFastCardsSearchRow
              expanded={searchExpanded}
              value={searchQuery}
              onChange={setSearchQuery}
              onExpandedChange={setSearchExpanded}
            />
            <MenuFastCardsCategoryNav
              categories={initialCategories}
              activeId={activeCat}
              onChange={setActiveCat}
            />
          </div>

          <div className="mf-cards-body" id="mf-menu-panel" role="tabpanel" aria-label="Menu items">
            <MenuFastCardsBrand siteName={siteName} tagline={tagline} logoUrl={logoUrl} />
            <MenuFastCardsHero config={config} />
            {isGlobalEmpty ? (
              <MenuFastCardsEmpty variant="global" />
            ) : isSearchEmpty ? (
              <MenuFastCardsEmpty variant="search" onClearSearch={() => setSearchQuery('')} />
            ) : isCategoryEmpty ? (
              <MenuFastCardsEmpty variant="category" onShowAll={() => setActiveCat('all')} />
            ) : (
              <MenuFastCardsGrid
                categories={visibleCategories}
                showCategoryTitles={activeCat === 'all'}
                cart={cart}
                authReady={authReady}
                onSelectItem={setSelectedItemId}
                onAddItem={addItem}
                onRemoveItem={removeItem}
              />
            )}
            <MenuFastCardsFooter config={config} />
          </div>

          <MenuFastCardsCart
            entries={entries}
            itemCount={itemCount}
            subtotal={subtotal}
            currency={currency}
            authReady={authReady}
            onAdd={addItem}
            onRemove={removeItem}
            onClear={clearCart}
            onExpandedChange={setCartExpanded}
            checkoutSlot={
              <>
                <MenuFastCardsCheckout
                  tenant={tenant}
                  config={config}
                  lines={lines}
                  showPreferredDate={showPreferredDate}
                  onClear={clearCart}
                  onSuccess={setOrderNumber}
                  primaryLabel={`Pay online · ${formatMenuPrice(subtotal, currency)}`}
                />
                {showWhatsApp && waUrl ? (
                  <a
                    className="mf-min-wa-btn"
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Or order via WhatsApp
                  </a>
                ) : null}
              </>
            }
          />
        </div>
      </div>
    </div>
  )
}
