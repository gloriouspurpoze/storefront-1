'use client'

import { useEffect, useMemo, useState } from 'react'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { PublicProduct, StorefrontConfig, StorefrontProductCategory } from '@/lib/storefront-api'
import { mergeStorefrontCategories } from '@/lib/productCategories'
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
import type { LuxeEssenceStorefrontContent } from './luxeEssenceContentTypes'
import { LuxeEssenceAnnouncementBar } from './content/LuxeEssenceAnnouncementBar'
import { LuxeEssenceOffersStrip } from './content/LuxeEssenceOffersStrip'
import { LuxeEssencePromoBlock } from './content/LuxeEssencePromoBlock'
import { LuxeEssencePopupBanner } from './content/LuxeEssencePopupBanner'
import './luxe-essence.css'

const EMPTY_CONTENT: LuxeEssenceStorefrontContent = {
  announcement: null,
  offers: [],
  promo: [],
  popup: null,
}

export function LuxeEssencePage({
  products,
  categories = [],
  tenant,
  config,
  content = EMPTY_CONTENT,
  navLinks,
  footerLinks,
}: {
  products: PublicProduct[]
  categories?: StorefrontProductCategory[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
  content?: LuxeEssenceStorefrontContent
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline || tenant.tagline
  const logoUrl = config?.branding?.logoUrl || tenant.logoUrl

  const { lines, itemCount, subtotal, setQuantity, removeLine, clear } = useCart()
  const { requireAuthForCart } = useCartAuthGate()
  const { addToCart, qtyFor, totalQtyForProduct, authReady, toast } = useLuxeEssenceAddToCart()

  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [shippingPolicyOpen, setShippingPolicyOpen] = useState(false)
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null)

  const heroCategories = useMemo(
    () =>
      mergeStorefrontCategories(
        categories.map((c) => ({
          slug: c.slug,
          name: c.name,
          sortOrder: c.sortOrder ?? 100,
        })),
        products,
      ),
    [categories, products],
  )

  const catalogProducts = useMemo(() => {
    if (!selectedCategorySlug) return products
    return products.filter((product) => {
      const slug =
        product.categorySlug?.trim() ||
        (product as PublicProduct & { category_slug?: string }).category_slug?.trim()
      return slug === selectedCategorySlug
    })
  }, [products, selectedCategorySlug])

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

  const { announcement, offers, promo, popup } = content

  return (
    <div className="le-root theme-luxe-essence">
      {popup ? <LuxeEssencePopupBanner banner={popup} tenantId={tenant.id} /> : null}
      <LuxeEssenceMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        config={config}
        navLinks={navLinks}
      />
      <LuxeEssenceShippingPolicyModal
        open={shippingPolicyOpen}
        onClose={() => setShippingPolicyOpen(false)}
        config={config}
      />
      {announcement ? <LuxeEssenceAnnouncementBar data={announcement} /> : null}
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

      <LuxeEssenceHero
        config={config}
        siteName={siteName}
        products={products}
        categories={heroCategories}
        selectedCategorySlug={selectedCategorySlug}
        onSelectCategory={setSelectedCategorySlug}
        suppressPromoStrip={Boolean(announcement)}
      />

      {offers.length > 0 ? <LuxeEssenceOffersStrip slides={offers} /> : null}

      {products.length === 0 ? (
        <LuxeEssenceCatalogEmpty />
      ) : catalogProducts.length === 0 ? (
        <LuxeEssenceCatalogEmpty message="No products in this category yet. Try another category or browse all." />
      ) : (
        <LuxeEssenceProductGrid
          products={catalogProducts}
          authReady={authReady}
          totalQtyForProduct={totalQtyForProduct}
          onAdd={addToCart}
          onSelectOptions={(product) => setSelectedProductId(product.id)}
        />
      )}

      {promo.length > 0 ? <LuxeEssencePromoBlock slides={promo} /> : null}

      <LuxeEssenceFooter
        config={config}
        siteName={siteName}
        tagline={tagline}
        footerLinks={footerLinks}
      />

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
