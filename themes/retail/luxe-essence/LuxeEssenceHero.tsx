'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
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
}: {
  config: StorefrontConfig | null
  siteName: string
  products: PublicProduct[]
}) {
  const headline = config?.content?.heroHeadline?.trim()
  const subcopy = config?.content?.heroSubcopy?.trim()
  const title = headline || siteName

  const heroProducts = useMemo(
    () => products.filter((p) => p.imageUrl?.trim()).slice(0, 2),
    [products],
  )
  const showVisual = heroProducts.length > 0

  return (
    <>
      <section className={`le-hero${showVisual ? '' : ' le-hero--no-visual'}`}>
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
        {showVisual ? (
          <div className="le-hero-visual">
            {heroProducts.map((product) => (
              <HeroProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </section>
      <LuxeEssencePromoStrip config={config} />
    </>
  )
}
