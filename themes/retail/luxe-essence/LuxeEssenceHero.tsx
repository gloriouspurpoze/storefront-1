'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { OffersStrip } from '@/components/content/OffersStrip'
import type { PublicProduct, StorefrontConfig, StorefrontSlider } from '@/lib/storefront-api'
import type { ProductCategoryNav } from '@/lib/productCategories'
import { getStorefrontPromoStripLines } from '@/lib/storefrontPromoStrip'
import { getSlideImageUrl } from '@/lib/storefrontContent'
import { categoryHref } from './luxeEssenceNav'

function HeroProductCard({
  product,
  featured = false,
}: {
  product: PublicProduct
  featured?: boolean
}) {
  const imageUrl = product.imageUrl?.trim()
  return (
    <Link
      href={`/products/${product.slug}`}
      className={`le-hero-card${featured ? ' le-hero-card--featured' : ''}`}
    >
      <div className={`le-hero-card-img${imageUrl ? '' : ' le-hero-card-img--empty'}`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={product.name} />
        ) : null}
      </div>
      <div className="le-hero-card-label">
        <span className="le-hero-card-name">{product.name}</span>
        <span className="le-hero-card-cta" aria-hidden>
          View
        </span>
      </div>
    </Link>
  )
}

function HeroCmsSlide({ slide }: { slide: StorefrontSlider }) {
  const imageUrl = getSlideImageUrl(slide)
  const subtitle = slide.subtitle?.trim()
  const ctaText = slide.button_text?.trim()
  const ctaUrl = slide.button_url?.trim()

  const body = (
    <>
      <div className={`le-hero-card-img${imageUrl ? '' : ' le-hero-card-img--empty'}`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={slide.image_alt?.trim() || slide.title} />
        ) : null}
      </div>
      <div className="le-hero-card-label">
        <span className="le-hero-card-name">{slide.title}</span>
        {subtitle ? <span className="le-hero-cms-sub">{subtitle}</span> : null}
        {ctaText && ctaUrl ? (
          <span className="le-hero-card-cta" aria-hidden>
            {ctaText}
          </span>
        ) : null}
      </div>
    </>
  )

  if (ctaUrl) {
    const external = /^https?:\/\//i.test(ctaUrl)
    if (external) {
      return (
        <a className="le-hero-card le-hero-card--featured" href={ctaUrl} target="_blank" rel="noopener noreferrer">
          {body}
        </a>
      )
    }
    return (
      <Link className="le-hero-card le-hero-card--featured" href={ctaUrl}>
        {body}
      </Link>
    )
  }

  return <article className="le-hero-card le-hero-card--featured">{body}</article>
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
  heroSlides = [],
  /** When CMS announcement is active, hide shipping-policy promo strip. */
  suppressPromoStrip = false,
}: {
  config: StorefrontConfig | null
  siteName: string
  products: PublicProduct[]
  categories?: ProductCategoryNav[]
  heroSlides?: StorefrontSlider[]
  suppressPromoStrip?: boolean
}) {
  const headline = config?.content?.heroHeadline?.trim()
  const subcopy = config?.content?.heroSubcopy?.trim()
  const title = headline || siteName
  const eyebrow = config?.branding?.tagline?.trim()
  const ctaLabel = config?.content?.heroCtaLabel?.trim() || 'Shop collection'
  const ctaHref = config?.content?.heroCtaHref?.trim() || '#products'
  const ctaExternal = /^https?:\/\//i.test(ctaHref)

  const cmsHeroSlides = useMemo(
    () => heroSlides.filter((slide) => Boolean(getSlideImageUrl(slide)?.trim()) || slide.title?.trim()),
    [heroSlides],
  )
  const heroProducts = useMemo(
    () => products.filter((p) => p.imageUrl?.trim()).slice(0, 2),
    [products],
  )
  const useCmsVisual = cmsHeroSlides.length > 0
  const showVisual = useCmsVisual || heroProducts.length > 0
  const showCategories = categories.length > 0

  return (
    <>
      <section className={`le-hero${showVisual ? '' : ' le-hero--no-visual'}`}>
        <div className="le-hero-atmosphere" aria-hidden />

        <div className="le-hero-inner">
          <div className="le-hero-copy">
            {eyebrow && headline ? <p className="le-hero-eyebrow">{eyebrow}</p> : null}
            <h1 className="le-hero-title">{title}</h1>
            {subcopy ? <p className="le-hero-sub">{subcopy}</p> : null}
            <div className="le-hero-actions">
              {ctaExternal ? (
                <a href={ctaHref} className="le-btn-primary" target="_blank" rel="noopener noreferrer">
                  {ctaLabel}
                </a>
              ) : ctaHref.startsWith('#') ? (
                <a href={ctaHref} className="le-btn-primary">
                  {ctaLabel}
                </a>
              ) : (
                <Link href={ctaHref} className="le-btn-primary">
                  {ctaLabel}
                </Link>
              )}
            </div>
          </div>

          {useCmsVisual ? (
            <div className="le-hero-visual le-hero-visual--single le-hero-visual--cms" aria-label="Featured">
              <OffersStrip
                items={cmsHeroSlides}
                className="le-hero-cms"
                trackClassName="le-hero-cms-track"
                slideClassName="le-hero-cms-slide"
                dotsClassName="le-hero-cms-dots"
                dotClassName="le-hero-cms-dot"
                dotActiveClassName="le-hero-cms-dot--active"
                ariaLabel="Home hero slides"
                getItemKey={(slide) => slide.id}
                renderItem={(slide) => <HeroCmsSlide slide={slide} />}
              />
            </div>
          ) : showVisual ? (
            <div
              className={`le-hero-visual${heroProducts.length === 1 ? ' le-hero-visual--single' : ''}`}
              aria-label="Featured products"
            >
              {heroProducts.map((product, index) => (
                <HeroProductCard key={product.id} product={product} featured={index === 0} />
              ))}
            </div>
          ) : null}
        </div>

        {showCategories ? (
          <nav className="le-hero-categories" aria-label="Shop by category">
            <p className="le-hero-categories-label">Shop by category</p>
            <div className="le-hero-categories-track">
              <Link href="/products" className="le-hero-category-pill">
                All
              </Link>
              {categories.map((category) => (
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
      </section>
      {suppressPromoStrip ? null : <LuxeEssencePromoStrip config={config} />}
    </>
  )
}
