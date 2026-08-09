'use client'

import Link from 'next/link'
import { OffersStrip } from '@/components/content/OffersStrip'
import type { StorefrontConfig, StorefrontSlider } from '@/lib/storefront-api'
import { getSlideImageUrl } from '@/lib/storefrontContent'

function HeroCmsSlide({ slide }: { slide: StorefrontSlider }) {
  const imageUrl = getSlideImageUrl(slide)
  const subtitle = slide.subtitle?.trim()
  const ctaText = slide.button_text?.trim()
  const ctaUrl = slide.button_url?.trim()

  const body = (
    <>
      {imageUrl ? (
        <div className="mf-cards-hero-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={slide.image_alt?.trim() || slide.title} />
        </div>
      ) : null}
      <div className="mf-cards-hero-slide-copy">
        <p className="mf-cards-hero-slide-title">{slide.title}</p>
        {subtitle ? <p className="mf-cards-hero-slide-sub">{subtitle}</p> : null}
        {ctaText && ctaUrl ? <span className="mf-cards-hero-slide-cta">{ctaText}</span> : null}
      </div>
    </>
  )

  if (ctaUrl) {
    const external = /^https?:\/\//i.test(ctaUrl)
    if (external) {
      return (
        <a className="mf-cards-hero-slide" href={ctaUrl} target="_blank" rel="noopener noreferrer">
          {body}
        </a>
      )
    }
    return (
      <Link className="mf-cards-hero-slide" href={ctaUrl}>
        {body}
      </Link>
    )
  }

  return <article className="mf-cards-hero-slide">{body}</article>
}

/** Studio copy and/or CMS home_page_hero slides — hidden when both are empty. */
export function MenuFastCardsHero({
  config,
  heroSlides = [],
}: {
  config: StorefrontConfig | null
  heroSlides?: StorefrontSlider[]
}) {
  const headline = config?.content?.heroHeadline?.trim()
  const subcopy = config?.content?.heroSubcopy?.trim()
  const slides = heroSlides.filter(
    (slide) => Boolean(getSlideImageUrl(slide)?.trim()) || slide.title?.trim(),
  )

  if (!headline && !subcopy && slides.length === 0) return null

  return (
    <section className="mf-cards-hero" aria-label="Featured">
      {headline ? <h2 className="mf-cards-hero-title">{headline}</h2> : null}
      {subcopy ? <p className="mf-cards-hero-sub">{subcopy}</p> : null}
      {slides.length > 0 ? (
        <OffersStrip
          items={slides}
          className="mf-cards-hero-cms"
          trackClassName="mf-cards-hero-cms-track"
          slideClassName="mf-cards-hero-cms-slide"
          dotsClassName="mf-cards-hero-cms-dots"
          dotClassName="mf-cards-hero-cms-dot"
          dotActiveClassName="mf-cards-hero-cms-dot--active"
          ariaLabel="Home hero slides"
          getItemKey={(slide) => slide.id}
          renderItem={(slide) => <HeroCmsSlide slide={slide} />}
        />
      ) : null}
    </section>
  )
}
