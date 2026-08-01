'use client'

import Link from 'next/link'
import { StandardStorefrontNav } from '@/components/StandardStorefrontNav'
import { LayoutThemePageShell } from '@/components/LayoutThemePageShell'
import { StorefrontFaqsSection } from '@/components/StorefrontFaqsSection'
import {
  ProductPriceBlock,
  ProductPurchaseBlock,
} from '@/themes/retail/AddToCartButton'
import { useCart } from '@/themes/retail/cart'
import type { StorefrontCmsFaq } from '@/lib/cms-content'
import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '@/themes/retail/types'
import '@/themes/retail/soft-studio/soft-studio.css'
import '@/themes/retail/luxe-essence/luxe-essence.css'
import '@/themes/retail/retail-pdp.css'
import '@/themes/retail/retail-cart.css'
import { containsHtml } from '@/lib/product-seo'

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
}: {
  product: PublicProduct
  tenant: ThemeTenant
  config: StorefrontConfig | null
  themeKey?: string
  navLinks?: { href: string; label: string }[]
  faqs?: StorefrontCmsFaq[] | null
}) {
  const { itemCount } = useCart()
  const isSoftStudio = themeKey === 'soft-studio'
  const isLuxe = themeKey === 'luxe-essence'
  const rootClass = themeRootClass(themeKey)

  const detailBody = (
  <>
    <nav className="sf-pdp-breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      <span aria-hidden>›</span>
      <Link href="/products">Shop</Link>
      <span aria-hidden>›</span>
      <span aria-current="page">{product.name}</span>
    </nav>

    <div className="sf-pdp-grid">
      <div className="sf-pdp-gallery">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="sf-pdp-gallery-fallback">{product.name.charAt(0)}</div>
        )}
      </div>

      <div className="sf-pdp-info">
        {product.categoryName ? <p className="sf-pdp-category">{product.categoryName}</p> : null}
        <h1>{product.name}</h1>
        <span className={`sf-pdp-stock ${product.inStock ? 'sf-pdp-stock--in' : 'sf-pdp-stock--out'}`}>
          {product.inStock ? 'In stock' : 'Out of stock'}
        </span>

        <ProductPriceBlock product={product} />

        {product.description || product.shortDescription ? (
          <ProductDescription text={product.description ?? product.shortDescription ?? ''} />
        ) : null}

        <ProductPurchaseBlock product={product} variantTone={isLuxe ? 'luxe' : isSoftStudio ? 'soft-studio' : 'default'} />

        <p className="sf-pdp-trust">
          <Link href="/shipping-policy">Shipping policy</Link>
          {' · '}
          <Link href="/orders/track">Track an order</Link>
        </p>
      </div>
    </div>

    <StorefrontFaqsSection
      faqs={faqs}
      fallbackItems={config?.content?.faqItems}
      enabled={faqSectionEnabled(config)}
      className="sf-pdp-faq"
    />
  </>
  )

  if (isSoftStudio) {
    return (
      <div className={`${rootClass} min-h-screen`}>
        <LayoutThemePageShell
          config={config}
          siteName={tenant.name}
          tagline={tenant.tagline}
          navLinks={navLinks}
        >
          <main className="sf-page-shell">{detailBody}</main>
        </LayoutThemePageShell>
      </div>
    )
  }

  if (isLuxe) {
    return (
      <div className={`${rootClass} min-h-screen`}>
        <LayoutThemePageShell
          config={config}
          siteName={tenant.name}
          tagline={tenant.tagline}
          wide
          navLinks={navLinks}
        >
          <main className="sf-page-shell">{detailBody}</main>
        </LayoutThemePageShell>
      </div>
    )
  }

  return (
    <>
      <StandardStorefrontNav
        tenant={tenant}
        config={config}
        variant="retail"
        cartHref="/cart"
        itemCount={itemCount}
        navLinks={navLinks}
      />
      <main className="sf-page-shell">{detailBody}</main>
    </>
  )
}
