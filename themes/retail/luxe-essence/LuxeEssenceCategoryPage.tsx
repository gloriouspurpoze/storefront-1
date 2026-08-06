'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CategoryMarketingBlocks } from '@/components/CategoryMarketingBlocks'
import type { CategoryMarketingConfig } from '@/lib/categoryMarketing'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { ProductCategoryNav } from '@/lib/productCategories'
import type { PublicProduct, StorefrontConfig, StorefrontProductCategory } from '@/lib/storefront-api'
import type { ThemeTenant } from '../types'
import { LuxeEssenceCatalogEmpty } from './LuxeEssenceCatalogEmpty'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'
import { LuxeEssenceProductGrid } from './LuxeEssenceProductGrid'
import { LuxeEssenceProductModal } from './LuxeEssenceProductModal'
import { LuxeEssenceToast } from './LuxeEssenceToast'
import { useLuxeEssenceAddToCart } from './useLuxeEssenceAddToCart'

export function LuxeEssenceCategoryPage({
  categoryName,
  categorySlug: _categorySlug,
  products,
  categories = [],
  marketing = null,
  tenant,
  config,
  navLinks,
  footerLinks,
}: {
  categoryName: string
  categorySlug: string
  products: PublicProduct[]
  categories?: Array<ProductCategoryNav | StorefrontProductCategory>
  marketing?: CategoryMarketingConfig | null
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
}) {
  const { addToCart, qtyFor, totalQtyForProduct, authReady, toast } = useLuxeEssenceAddToCart()
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const selectedProduct =
    selectedProductId != null ? (products.find((p) => p.id === selectedProductId) ?? null) : null

  const pageTitle = marketing?.mainHeading?.trim() || categoryName
  /** Avoid duplicate H1/H2 when blocks also render mainHeading. */
  const marketingWithoutTitle: CategoryMarketingConfig | null = marketing
    ? { ...marketing, mainHeading: '' }
    : null

  return (
    <LuxeEssenceLayoutPage
      tenant={tenant}
      config={config}
      navLinks={navLinks}
      footerLinks={footerLinks}
      categories={categories}
      mainClassName="sf-page-shell le-category-page"
    >
      <nav className="le-category-crumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden>/</span>
        <Link href="/products">All products</Link>
        <span aria-hidden>/</span>
        <span>{categoryName}</span>
      </nav>

      
      {products.length === 0 ? (
        <LuxeEssenceCatalogEmpty
          label="Shop"
          title={categoryName}
          message="No products in this category yet. Browse all products or try another category."
        />
      ) : (
        <LuxeEssenceProductGrid
          products={products}
          authReady={authReady}
          totalQtyForProduct={totalQtyForProduct}
          onAdd={addToCart}
          onSelectOptions={(product) => setSelectedProductId(product.id)}
          sectionLabel="Shop"
          sectionTitle={categoryName}
        />
      )}

      <nav className="le-policy-links" aria-label="Related links">
        <Link href="/products">All products</Link>
        <Link href="/">Back to store</Link>
      </nav>

      <header className="le-category-heading">
        {/* <p className="sf-page-eyebrow">Category</p> */}
        <h1 className="sf-page-title">{pageTitle}</h1>
      </header>

      {marketingWithoutTitle ? (
        <CategoryMarketingBlocks config={marketingWithoutTitle} className="le-cat-marketing" />
      ) : null}


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
