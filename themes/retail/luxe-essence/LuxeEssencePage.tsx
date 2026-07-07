'use client'

import { useEffect, useState } from 'react'
import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import { useCart } from '../cart'
import type { ThemeTenant } from '../types'
import { LuxeEssenceMenuDrawer } from './LuxeEssenceMenuDrawer'
import { LuxeEssenceShippingPolicyModal } from './LuxeEssenceShippingPolicyModal'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import { LuxeEssenceHeader } from './LuxeEssenceHeader'
import { LuxeEssenceFooter } from './LuxeEssenceFooter'
import { LuxeEssenceHero } from './LuxeEssenceHero'
import { LuxeEssenceProductGrid } from './LuxeEssenceProductGrid'
import { LuxeEssenceCatalogEmpty } from './LuxeEssenceCatalogEmpty'
import { useLuxeEssenceAddToCart } from './useLuxeEssenceAddToCart'
import { LuxeEssenceToast } from './LuxeEssenceToast'
import { LuxeEssenceProductModal } from './LuxeEssenceProductModal'
import { LuxeEssenceCartModal } from './LuxeEssenceCartModal'
import { LuxeEssenceCheckoutModal } from './LuxeEssenceCheckoutModal'
import './luxe-essence.css'

export function LuxeEssencePage({
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
  const logoUrl = config?.branding?.logoUrl || tenant.logoUrl

  const { lines, itemCount, subtotal, setQuantity, removeLine, clear } = useCart()
  const { requireAuthForCart } = useCartAuthGate()
  const { addToCart, removeFromCart, qtyFor, totalQtyForProduct, authReady, toast } =
    useLuxeEssenceAddToCart()

  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [shippingPolicyOpen, setShippingPolicyOpen] = useState(false)

  const openCheckout = () => {
    if (!requireAuthForCart()) return
    setCartOpen(false)
    setCheckoutOpen(true)
  }

  const closeAll = () => {
    setCheckoutOpen(false)
    setCartOpen(false)
  }

  useEffect(() => {
    if (!cartOpen && !checkoutOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cartOpen, checkoutOpen])

  const modalOpen = cartOpen || checkoutOpen
  const selectedProduct =
    selectedProductId != null ? (products.find((p) => p.id === selectedProductId) ?? null) : null

  return (
    <div className="le-root theme-luxe-essence">
      <LuxeEssenceMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} config={config} />
      <LuxeEssenceShippingPolicyModal
        open={shippingPolicyOpen}
        onClose={() => setShippingPolicyOpen(false)}
        config={config}
      />
      <LuxeEssenceHeader
        config={config}
        siteName={siteName}
        tagline={tagline}
        logoUrl={logoUrl}
        menuOpen={menuOpen}
        itemCount={itemCount}
        onMenuOpen={() => setMenuOpen(true)}
        onCartOpen={() => {
          if (requireAuthForCart()) setCartOpen(true)
        }}
      />

      <LuxeEssenceHero config={config} siteName={siteName} products={products} />

      {products.length === 0 ? (
        <LuxeEssenceCatalogEmpty />
      ) : (
        <LuxeEssenceProductGrid
          products={products}
          authReady={authReady}
          totalQtyForProduct={totalQtyForProduct}
          onAdd={addToCart}
          onSelectOptions={(product) => setSelectedProductId(product.id)}
        />
      )}

      <LuxeEssenceFooter config={config} siteName={siteName} tagline={tagline} />

      <LuxeEssenceToast message={toast} />

      <LuxeEssenceProductModal
        product={selectedProduct}
        open={selectedProduct != null}
        onClose={() => setSelectedProductId(null)}
        getQuantity={(variantId) =>
          selectedProduct ? qtyFor(selectedProduct.id, variantId) : 0
        }
        actionsDisabled={!authReady}
        onAdd={(variantId) => {
          if (selectedProduct) addToCart(selectedProduct, variantId)
        }}
        onRemove={(variantId) => {
          if (selectedProduct) removeFromCart(selectedProduct.id, variantId)
        }}
      />

      <div
        className={`le-overlay ${modalOpen ? 'open' : ''}`}
        onClick={closeAll}
        role="presentation"
      />
      <LuxeEssenceCartModal
        open={cartOpen && !checkoutOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={openCheckout}
        onViewShippingPolicy={() => setShippingPolicyOpen(true)}
        config={config}
        lines={lines}
        itemCount={itemCount}
        subtotal={subtotal}
        setQuantity={setQuantity}
        removeLine={removeLine}
      />
      <LuxeEssenceCheckoutModal
        open={checkoutOpen}
        onBackToCart={() => {
          setCheckoutOpen(false)
          setCartOpen(true)
        }}
        onClose={closeAll}
        tenant={tenant}
        config={config}
        lines={lines}
        subtotal={subtotal}
        onClearCart={clear}
      />
    </div>
  )
}
