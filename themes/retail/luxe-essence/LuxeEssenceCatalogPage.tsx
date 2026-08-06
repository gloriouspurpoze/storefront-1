'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { PublicProduct, StorefrontConfig, StorefrontProductCategory } from '@/lib/storefront-api'
import { mergeStorefrontCategories } from '@/lib/productCategories'
import type { ThemeTenant } from '../types'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'
import { LuxeEssenceProductGrid } from './LuxeEssenceProductGrid'
import { LuxeEssenceCatalogEmpty } from './LuxeEssenceCatalogEmpty'
import { useLuxeEssenceAddToCart } from './useLuxeEssenceAddToCart'
import { LuxeEssenceToast } from './LuxeEssenceToast'
import { LuxeEssenceProductModal } from './LuxeEssenceProductModal'
import { categoryHref } from './luxeEssenceNav'

/** Thin /products catalog: Luxe shell + homepage grid/add/toast/modal (cart → /cart). */
export function LuxeEssenceCatalogPage({
  products,
  categories = [],
  tenant,
  config,
  navLinks,
  footerLinks,
}: {
  products: PublicProduct[]
  categories?: StorefrontProductCategory[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
}) {
  const { addToCart, qtyFor, totalQtyForProduct, authReady, toast } = useLuxeEssenceAddToCart()
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const catalogCategories = useMemo(
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

  const selectedProduct =
    selectedProductId != null ? (products.find((p) => p.id === selectedProductId) ?? null) : null

  return (
    <LuxeEssenceLayoutPage
      tenant={tenant}
      config={config}
      mainClassName="le-catalog-page"
      navLinks={navLinks}
      footerLinks={footerLinks}
      categories={catalogCategories}
    >
      {catalogCategories.length > 0 ? (
        <nav className="le-hero-categories" aria-label="Shop by category">
          <p className="le-hero-categories-label">Shop by category</p>
          <div className="le-hero-categories-track">
            <Link href="/products" className="le-hero-category-pill is-active">
              All
            </Link>
            {catalogCategories.map((category) => (
              <Link
                key={category.slug}
                href={categoryHref(category.slug)}
                className="le-hero-category-pill"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}

      {products.length === 0 ? (
        <LuxeEssenceCatalogEmpty title="All products" />
      ) : (
        <LuxeEssenceProductGrid
          products={products}
          authReady={authReady}
          totalQtyForProduct={totalQtyForProduct}
          onAdd={addToCart}
          onSelectOptions={(product) => setSelectedProductId(product.id)}
          sectionTitle="All products"
        />
      )}

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
    </LuxeEssenceLayoutPage>
  )
}
