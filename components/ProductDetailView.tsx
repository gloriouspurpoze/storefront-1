'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SiteHeaderClient as SiteHeader } from '@/themes/retail/SiteHeaderClient'
import { StickyBuyBar } from '@/components/commerce/StickyBuyBar'
import { Accordion, Breadcrumb, IconRefresh, IconShield, IconTruck } from '@/ui'
import { LayoutThemePageShell } from '@/components/LayoutThemePageShell'
import { StorefrontFaqsSection } from '@/components/StorefrontFaqsSection'
import {
  ProductPriceBlock,
  ProductPurchaseBlock,
} from '@/themes/retail/AddToCartButton'
import type { StorefrontCmsFaq } from '@/lib/cms-content'
import type { PublicProduct, StorefrontConfig, StorefrontProductCategory } from '@/lib/storefront-api'
import type { ThemeTenant } from '@/themes/retail/types'
import '@/themes/retail/soft-studio/soft-studio.css'
import '@/themes/retail/luxe-essence/luxe-essence.css'
import '@/themes/retail/retail-pdp.css'
import '@/themes/retail/retail-cart.css'
import '@/components/commerce/pdp.css'
import { containsHtml } from '@/lib/product-seo'
import { ProductImageGallery } from '@/components/ProductImageGallery'
import { getDefaultVariant, isVariantInStock } from '@/lib/productVariants'
import { WishlistHeartButton } from '@/components/wishlist/WishlistHeartButton'
import { useRegisterWishlistAddon } from '@/components/wishlist/useWishlist'

/** Matches HomePageSections `flagOn(cfg, 'showFaq')`. */
function faqSectionEnabled(config: StorefrontConfig | null): boolean {
  const flags = config?.featureFlags as Record<string, boolean | undefined> | undefined
  const addons = config?.featureAddons ?? {}
  if (addons.showFaq?.purchased) return true
  return flags?.showFaq !== false
}

function themeRootClass(themeKey?: string): string {
  if (themeKey === 'soft-studio') return 'ss-root'
  if (themeKey === 'luxe-essence') return 'le-root'
  return ''
}

function ProductDescription({ text }: { text: string }) {
  if (containsHtml(text)) {
    return <div className="sf-pdp-description" dangerouslySetInnerHTML={{ __html: text }} />
  }
  return <p className="sf-pdp-description">{text}</p>
}

export function ProductDetailView({
  product,
  tenant,
  config,
  themeKey,
  navLinks,
  faqs,
  categories,
}: {
  product: PublicProduct
  tenant: ThemeTenant
  config: StorefrontConfig | null
  themeKey?: string
  navLinks?: { href: string; label: string }[]
  faqs?: StorefrontCmsFaq[] | null
  /** Header mega-menu categories (default theme only). */
  categories?: StorefrontProductCategory[]
}) {
  const wishlistEnabled = useRegisterWishlistAddon(config)
  const isSoftStudio = themeKey === 'soft-studio'
  const isLuxe = themeKey === 'luxe-essence'
  const rootClass = themeRootClass(themeKey)
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product])
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    defaultVariant?.id ?? null,
  )

  useEffect(() => {
    setSelectedVariantId(defaultVariant?.id ?? null)
  }, [product.id, defaultVariant?.id])

  const isModern = !isSoftStudio && !isLuxe
  const inStockNow = isVariantInStock(product, selectedVariantId)
  const descriptionText = product.description ?? product.shortDescription ?? ''

  const body = (
    <main className="sf-pdp--modern sf-container">
      <div className="sf-pdp-crumbs">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/products' },
            ...(product.categorySlug && product.categoryName
              ? [{ label: product.categoryName, href: `/categories/${product.categorySlug}` }]
              : []),
            { label: product.name },
          ]}
        />
      </div>
      <div className="sf-pdp-grid">
        <ProductImageGallery
          key={`${product.id}:${selectedVariantId ?? 'base'}`}
          product={product}
          variantId={selectedVariantId}
        />
        <div className="sf-pdp-info">
          {product.categoryName ? <p className="sf-pdp-category">{product.categoryName}</p> : null}
          <h1>{product.name}</h1>
          <ProductPriceBlock product={product} selectedVariantId={selectedVariantId} />
          <span className={`sf-pdp-stock ${inStockNow ? 'sf-pdp-stock--in' : 'sf-pdp-stock--out'}`}>
            {inStockNow ? 'In stock' : 'Out of stock'}
          </span>
          {product.shortDescription && product.description ? (
            <p className="sf-pdp-short">{product.shortDescription}</p>
          ) : null}
          <ProductPurchaseBlock
            product={product}
            variantTone="default"
            selectedVariantId={selectedVariantId}
            onSelectedVariantIdChange={setSelectedVariantId}
          />
          <WishlistHeartButton
            productId={product.id}
            productName={product.name}
            enabled={wishlistEnabled}
            variant="inline"
            className="sf-pdp-wishlist"
          />
          <ul className="sf-pdp-perks">
            <li>
              <IconShield size={18} /> Secure checkout
            </li>
            <li>
              <IconTruck size={18} /> <Link href="/orders/track">Track your order</Link>
            </li>
            <li>
              <IconRefresh size={18} /> <Link href="/shipping-policy">Shipping &amp; returns</Link>
            </li>
          </ul>
          <Accordion
            className="sf-pdp-accordion"
            items={[
              ...(descriptionText
                ? [{ id: 'desc', title: 'Description', content: <ProductDescription text={descriptionText} />, defaultOpen: true }]
                : []),
              {
                id: 'ship',
                title: 'Shipping & returns',
                content: (
                  <p style={{ margin: 0 }}>
                    Delivery times and return terms are listed in our{' '}
                    <Link href="/shipping-policy">shipping policy</Link>. You can follow any order from{' '}
                    <Link href="/orders/track">order tracking</Link>.
                  </p>
                ),
              },
            ]}
          />
        </div>
      </div>
      <StorefrontFaqsSection
        faqs={faqs}
        fallbackItems={config?.content?.faqItems}
        enabled={faqSectionEnabled(config)}
        className="sf-pdp-faq"
      />
    </main>
  )

  if (isModern) {
    return (
      <>
        <SiteHeader tenant={tenant} config={config} navLinks={navLinks} categories={categories} />
        {body}
        <StickyBuyBar product={product} variantId={selectedVariantId} />
      </>
    )
  }

  // Layout themes keep their own page shell + palette; the PDP body is shared.
  return (
    <div className={`${rootClass} min-h-screen`}>
      <LayoutThemePageShell
        config={config}
        siteName={tenant.name}
        tagline={tenant.tagline}
        wide={isLuxe}
        navLinks={navLinks}
      >
        {body}
      </LayoutThemePageShell>
      <StickyBuyBar product={product} variantId={selectedVariantId} />
    </div>
  )
}
