'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import type { ProductCategoryNav } from '@/lib/productCategories'
import { getStorefrontPromoStripLines } from '@/lib/storefrontPromoStrip'
import { LuxeEssenceHeroStoreStatus } from './LuxeEssenceStoreStatus'

function HeroProductCard({ product }: { product: PublicProduct }) {
  const imageUrl = product.imageUrl?.trim()
  return (
    <Link href={`/products/${product.slug}`} className="le-hero-card">
      <div className={`le-hero-card-img${imageUrl ? '' : ' le-hero-card-img--empty'}`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={product.name} />
        ) : null}
      </div>
      <div className="le-hero-card-label">{product.name}</div>
    </Link>
  )
}

function scrollToProducts() {
  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function LuxeEssencePromoStrip({ config }: { config: StorefrontConfig | null }) {
  const lines = useMemo(() => getStorefrontPromoStripLines(config), [config])
  if (lines.length === 0) return null

  return (
    <div className="le-strip" role="region" aria-label="Store highlights">
      {lines.map((text) => (
        <p key={text} className="le-strip-item">
          {text}
        </p>
      ))}
    </div>
  )
}

export function LuxeEssenceHero({
  config,
  siteName,
  products,
  categories = [],
  selectedCategorySlug = null,
  onSelectCategory,
}: {
  config: StorefrontConfig | null
  siteName: string
  products: PublicProduct[]
  categories?: ProductCategoryNav[]
  selectedCategorySlug?: string | null
  onSelectCategory?: (slug: string | null) => void
}) {
  const headline = config?.content?.heroHeadline?.trim()
  const subcopy = config?.content?.heroSubcopy?.trim()
  const title = headline || siteName

  const heroProducts = useMemo(
    () => products.filter((p) => p.imageUrl?.trim()).slice(0, 2),
    [products],
  )
  const showVisual = heroProducts.length > 0
  const showCategories = categories.length > 0
  const showRail = showVisual || showCategories

  const visualRef = useRef<HTMLDivElement>(null)
  const [railHeight, setRailHeight] = useState<number | undefined>()

  useEffect(() => {
    const el = visualRef.current
    if (!el || !showVisual) {
      setRailHeight(undefined)
      return
    }

    const syncHeight = () => setRailHeight(el.offsetHeight)
    syncHeight()

    const observer = new ResizeObserver(syncHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [showVisual, heroProducts])

  const showCopy = Boolean(headline || subcopy)
  const heroClass = [
    'le-hero',
    !showRail ? 'le-hero--no-visual' : '',
    showVisual && showCategories ? 'le-hero--with-categories' : '',
    showVisual && !showCategories ? 'le-hero--visual-only' : '',
    !showVisual && showCategories ? 'le-hero--categories-only' : '',
    showCopy && showCategories ? 'le-hero--with-copy' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const selectCategory = (slug: string | null) => {
    onSelectCategory?.(slug)
    scrollToProducts()
  }

  return (
    <>
      <section className={heroClass}>
        {showVisual ? (
          <div ref={visualRef} className="le-hero-visual">
            {heroProducts.map((product) => (
              <HeroProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}

        {showCopy ? (
          <div className="le-hero-copy">
            <LuxeEssenceHeroStoreStatus config={config} />
            <h2 className="le-hero-title">{title}</h2>
            {subcopy ? <p className="le-hero-sub">{subcopy}</p> : null}
            <div className="le-hero-actions">
              <a href="#products" className="le-btn-primary">
                Shop collection
              </a>
            </div>
          </div>
        ) : null}

        {showCategories ? (
          <aside
            className="le-hero-categories"
            aria-label="Shop by category"
            style={railHeight != null ? { maxHeight: railHeight } : undefined}
          >
            <button
              type="button"
              className={`le-hero-category-pill${selectedCategorySlug == null ? ' is-active' : ''}`}
              onClick={() => selectCategory(null)}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                type="button"
                className={`le-hero-category-pill${
                  selectedCategorySlug === category.slug ? ' is-active' : ''
                }`}
                onClick={() => selectCategory(category.slug)}
              >
                {category.name}
              </button>
            ))}
          </aside>
        ) : null}
      </section>
      <LuxeEssencePromoStrip config={config} />
    </>
  )
}
